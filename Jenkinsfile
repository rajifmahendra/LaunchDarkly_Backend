pipeline {
    agent any

    environment {
        CONTAINER_NAME = 'launchdarkly_backend'
        CHECKMARX_INSTALLATION = 'CxAST CLI'
        CHECKMARX_BASE_URL = 'https://anz.ast.checkmarx.net'
        CHECKMARX_TENANT = 'nfr-izeno'
        CHECKMARX_PROJECT = 'backend_demo_launch_darkly'
        REPO_NAME = 'launchdarkly_backend'
        IMAGE_TAG = 'latest'
    }

    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'feature-quota', description: 'Branch to build')
        string(name: 'IMAGE_NAME', defaultValue: 'launchdarkly_backend', description: 'Docker image name')
    }

    stages {
        stage('Checkout Code') {
            steps {
                script {
                    withCredentials([usernamePassword(
                        credentialsId: 'token-github-project-rajif',
                        usernameVariable: 'GIT_USER',
                        passwordVariable: 'GIT_TOKEN'
                    )]) {
                        if (fileExists("${env.REPO_NAME}/.git")) {
                            echo "Repo already exists. Pulling latest changes..."
                            dir("${env.REPO_NAME}") {
                                sh """
                                    git reset --hard
                                    git clean -fd
                                    git checkout ${params.BRANCH_NAME}
                                    git pull https://${GIT_USER}:${GIT_TOKEN}@github.com/rajifmahendra/${env.REPO_NAME}.git ${params.BRANCH_NAME}
                                """
                            }
                        } else {
                            echo "Cloning repository..."
                            sh """
                                git clone -b ${params.BRANCH_NAME} https://${GIT_USER}:${GIT_TOKEN}@github.com/rajifmahendra/${env.REPO_NAME}.git
                            """
                        }
                    }
                }
            }
        }

        stage('SAST Checkmarx') {
            steps {
                withCredentials([string(credentialsId: 'CHECKMARX_CREDENTIALS', variable: 'CX_TOKEN')]) {
                    script {
                        echo "🔍 Running SAST scan..."
                        checkmarxASTScanner additionalOptions: '--project-tags cicd-jenkins --scan-types SAST',
                            baseAuthUrl: 'https://anz.iam.checkmarx.net',
                            branchName: "${params.BRANCH_NAME}",
                            checkmarxInstallation: env.CHECKMARX_INSTALLATION,
                            credentialsId: CX_TOKEN,
                            projectName: env.CHECKMARX_PROJECT,
                            serverUrl: env.CHECKMARX_BASE_URL,
                            tenantName: env.CHECKMARX_TENANT,
                            useOwnAdditionalOptions: true
                    }
                }
            }
        }

        stage('Build Docker Image') {
            steps {
                dir("${env.REPO_NAME}") {
                    script {
                        if (!fileExists('Dockerfile')) {
                            error "❌ Dockerfile not found in ${env.REPO_NAME}!"
                        }
                        sh """
                            docker build -t ${params.IMAGE_NAME}:${env.IMAGE_TAG} .
                        """
                    }
                }
            }
        }

        stage('Run Docker Container') {
            steps {
                sh """
                    docker stop ${env.CONTAINER_NAME} || true
                    docker rm ${env.CONTAINER_NAME} || true
                    docker run -d -p 4000:3000 --name ${env.CONTAINER_NAME} ${params.IMAGE_NAME}:${env.IMAGE_TAG}
                """
            }
        }
    }

    post {
        success {
            echo "✅ SIT pipeline completed successfully and image pushed to Nexus."
        }
        failure {
            echo "❌ Pipeline failed. Please check logs above."
        }
    }
}
