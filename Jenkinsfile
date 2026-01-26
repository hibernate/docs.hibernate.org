pipeline {
	agent {
		label 'Worker&&Containers'
	}
	options {
		disableConcurrentBuilds()
		buildDiscarder logRotator(daysToKeepStr: '30', numToKeepStr: '10')
	}
	stages {
		stage('Publish documentation') {
			when {
				beforeAgent true
				branch 'main'
				not { changeRequest() }
			}
			steps {
				configFileProvider([configFile(fileId: 'release.config.ssh', targetLocation: env.HOME + '/.ssh/config'),
									configFile(fileId: 'release.config.ssh.knownhosts', targetLocation: env.HOME + '/.ssh/known_hosts')]) {
					sshagent(['jenkins.in.relation.to']) {
						sh "rsync --delete -avh --exclude 'Jenkinsfile' --exclude 'README.md' --exclude '.git' . in.relation.to:/var/www/docs.hibernate.org/"
					}
				}
			}
		}
	}
}
