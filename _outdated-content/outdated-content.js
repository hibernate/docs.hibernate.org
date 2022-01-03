var HibernateDoc = HibernateDoc || {};

HibernateDoc.OutdatedContent = (function() {
	var install = function(project) {
		// sanitize project value
		if (!/[a-z]+/.exec(project)) {
			return;
		}
	
		// build the url to redirect to
		jQuery_3_1.getJSON('/hibernate/_outdated-content/' + project + '.json', function (json) {
			// Follow the scroll of the user to choose the best hash possible
			var currentHash = window.location.hash;
			jQuery_3_1(document).scroll(function () {
				// in order: html docbook output, html5 docbook output, asciidoc output
				jQuery_3_1('h2 > a[id], h3 > a[id], section[id], h2[id], h3[id]').each(function () {
					var hash = jQuery_3_1(this).attr('id');
					if (/^d0e[0-9]+$/.exec(hash)) {
						// we don't consider the numeric hashes as they have been renamed to strings later
						return;
					}
					var top = window.pageYOffset;
					var distance = top - jQuery_3_1(this).offset().top;
					if (distance < 30 && distance > -30 && currentHash != hash) {
						if (history.replaceState) {
							history.replaceState(null, null, "#" + hash);
						} else {
							window.location.hash = '#' + hash;
						} 
						currentHash = hash;
					}
				});
			});

			var currentUrl = window.location.pathname;
			var stableUrl;
			var pageHash;

			// multi page
			var matchMulti = new RegExp(json.multi.pattern).exec(currentUrl);
			var matchSingle = new RegExp(json.single.pattern).exec(currentUrl);

			if (matchMulti && matchMulti.length == 3) {
				var currentVersion = matchMulti[1];
				var currentPage = matchMulti[2];

				if (currentVersion == json.stable || _isNewerThan(currentVersion, json.stable) || currentVersion == 'stable' || currentVersion == 'current') {
					return;
				}

				var redirectToMultiPage = (json.multi.target.indexOf('${page}') > -1);

				if (redirectToMultiPage) {
					var i = 0;
					var redirectStart = 0;
					var redirectEnd = 0;
					for (versionInformation of json.versions) {
						if (versionInformation.version == json.stable) {
							redirectEnd = i;
						}
						if (versionInformation.version == currentVersion) {
							redirectStart = i;
							break;
						}
						i++;
					}

					if (redirectStart == 0) {
						return;
					}

					var redirectPage = currentPage;
					for (var j = redirectStart; j >= redirectEnd; j--) {
						if (!('redirects' in json.versions[j])) {
							continue;
						}
						if (redirectPage in json.versions[j].redirects) {
							redirectPage = json.versions[j].redirects[redirectPage];
						}
					}

					stableUrl = json.multi.target.replace('${version}', json.stable).replace('${page}', redirectPage);
				} else {
					pageHash = jQuery_3_1('div.titlepage h2.title a').attr('id');
					stableUrl = json.multi.target.replace('${version}', json.stable);
				}
			} else if (matchSingle && matchSingle.length == 3) {
				var currentVersion = matchSingle[1];
				if (currentVersion == json.stable || _isNewerThan(currentVersion, json.stable) || currentVersion == 'stable' || currentVersion == 'current') {
					return;
				}

				stableUrl = json.single.target.replace('${version}', json.stable).replace('${page}', '');
			} else {
				return;
			}

			stableUrl += '?v=' + json.stable;

			jQuery_3_1('head').append('<style type="text/css">' +
				'body {' +
				'	padding-bottom: 50px;' +
				'}' +
				'.outdated-content {' +
				'	position: fixed;' +
				'	bottom: 0;' +
				'	left: 0;' +
				'	text-align:center;' +
				'	width:100%;' +
				'	padding: 20px;' +
				'	background-color: orange;' +
				'	background-color: #ffbc3b;' +
				'	border-top: 1px solid orange;' +
				'	font-weight: bold;' +
				'	font-size: 20px;' +
				'	color: white;' +
				'	text-shadow: 0 1px 1px rgba(85, 85, 85, 0.55);' +
				'	z-index: 1001;' +
				'}' +
				'a.version {' +
				'	border: 1px solid #AAA;' +
				'	border-radius: 4px;' +
				'	background-color: #BBB;' +
				'	padding: 3px 8px;' +
				'	color: white;' +
				'	text-shadow: 0 1px 1px rgba(85, 85, 85, 0.55);	' +
				'	text-decoration: none;' +
				'}' +
				'a.version:hover {' +
				'	background-color: #CCC;' +
				'}' +
				'a#close-outdated {' +
				'	float:right; ' +
				'	margin-right: 40px;' +
				'	cursor: pointer;' +
				'	text-decoration:none;' +
				'	color: white;' +
				'	font-weight: bold;' +
				'}' +
				'#toc.toc2 > ul {' +
				'	margin-bottom: 8em;' +
				'}' +
			'</style>');
			if (document.cookie.indexOf('hibernate-doc-hide-outdated-cookie=true') == -1) {
				jQuery_3_1('body').append('<div class="outdated-content">This content refers to an earlier version of ' + json.project + '. Go to latest stable: <a id="stable-url" href="' + stableUrl + '" class="version">version ' + json.stable +'</a>.<a id="close-outdated" title="Close this banner">&times;</a></div>');
				jQuery_3_1('a#stable-url').on('click', function(e) {
					e.preventDefault();
					var url = this.href;
					if (window.location.hash != '' && window.location.hash != '#' && !/^#d0e[0-9]+$/.exec(window.location.hash)) {
						url += window.location.hash;
					} else if (pageHash) {
						url += '#' + pageHash;
					}
					window.location.href = url;
				});
				jQuery_3_1('a#close-outdated').on('click', function(e) {
					e.preventDefault();
					jQuery_3_1('.outdated-content').hide();
					document.cookie = 'hibernate-doc-hide-outdated-cookie=true; path=/';
				});
			}
		})
	}
	
	var _isNewerThan = function(version, reference) {
		var versionObject = _extractVersion(version);
		var referenceObject = _extractVersion(reference);
		if (versionObject.major == referenceObject.major) {
			return versionObject.minor > referenceObject.minor;
		}
		return versionObject.major > referenceObject.major;
	}
	
	var _extractVersion = function(version) {
		var match = /([0-9]+)\.([0-9]+)/.exec(version);
		if (match.length != 3) {
			return null;
		}
		return { major: parseInt(match[1]), minor: parseInt(match[2]) };
	}

	return {
		install: install
	}
}) ();

