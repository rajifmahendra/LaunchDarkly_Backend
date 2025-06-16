pipeline {
    agent any

    environment {
        CONTAINER_NAME = 'launchdarkly_backend'
        CHECKMARX_INSTALLATION = 'CxAST CLI'
        CHECKMARX_BASE_URL = 'https://anz.ast.checkmarx.net'
        CHECKMARX_TENANT = 'nfr-izeno'
        CHECKMARX_PROJECT = 'backend_demo_launch_darkly'
        REPO_NAME = 'Launchdarkly-Backend-Demo'
        IMAGE_TAG = 'latest'
    }

    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'feature-quota', description: 'Branch to build')
        string(name: 'IMAGE_NAME', defaultValue: 'launchdarkly_backend', description: 'Docker image name')
    }

    stages {
        stage('Checkout Code') {
            steps {
                withCredentials([usernamePassword(credentialsId: '14d0f3df-5f8e-4401-afb9-a6b85a8a1b93', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                    script {
                        def repoPath = "${env.REPO_NAME}/.git"
                        if (fileExists(repoPath)) {
                            echo "Repo already exists. Pulling latest changes..."
                            dir("${env.REPO_NAME}") {
                                sh """
                                    git reset --hard
                                    git clean -fd
                                    git checkout ${params.BRANCH_NAME}
                                    git pull https://${GIT_USER}:${GIT_TOKEN}@github.com/rahmaneffendi/${env.REPO_NAME}.git ${params.BRANCH_NAME}
                                """
                            }
                        } else {
                            echo "Cloning repository..."
                            sh """
                                git clone -b ${params.BRANCH_NAME} https://${GIT_USER}:${GIT_TOKEN}@github.com/rahmaneffendi/${env.REPO_NAME}.git
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

        // Uncomment jika ingin aktifkan tahapan Docker build dan run
        
        stage('Build Docker Image') {
            steps {
                dir("${env.REPO_NAME}") {
                    script {
                        if (!fileExists('Dockerfile')) {
                            error "❌ Dockerfile not found in ${env.REPO_NAME}!"
                        }
                        sh """
                            docker build --no-cache -t ${params.IMAGE_NAME}:${env.IMAGE_TAG} .
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

