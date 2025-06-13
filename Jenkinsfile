pipeline {
    agent any

    environment {
        CONTAINER_NAME = 'launchdarkly_backend'
        CHECKMARX_INSTALLATION = 'CxAST CLI'
        CHECKMARX_BASE_URL = 'https://anz.ast.checkmarx.net'
        CHECKMARX_TENANT = 'nfr-izeno'
        CHECKMARX_PROJECT = 'backend_demo_launch_darkly'
        // PRISMA_CLOUD_URL = 'https://asia-southeast1.cloud.twistlock.com/aws-singapore-962602732'
        REPO_NAME = 'Launchdarkly-Backend-Demo'
        IMAGE_TAG = 'latest'
    }

    parameters {
        string(name: 'BRANCH_NAME', defaultValue: 'feature-quota', description: 'Branch to build')
        string(name: 'IMAGE_NAME', defaultValue: 'launchdarkly_backend', description: 'Docker image name')
    }

    stages {
        stage("Checkout Code") {
            steps {
                script {
                    withCredentials([usernamePassword(credentialsId: '14d0f3df-5f8e-4401-afb9-a6b85a8a1b93', usernameVariable: 'GIT_USER', passwordVariable: 'GIT_TOKEN')]) {
                        if (fileExists("${env.REPO_NAME}/.git")) {
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

        stage("SAST Checkmarx") {
            steps {
                script {
                    echo "🔍 Running SAST scan..."
                    // Use withCredentials to fetch the secret
                    withCredentials([string(credentialsId: 'CHECKMARX_CREDENTIALS', variable: 'CX_TOKEN')]) {
                        
                        checkmarxASTScanner additionalOptions: '--project-tags cicd-jenkins --scan-types SAST',
                            baseAuthUrl: 'https://anz.iam.checkmarx.net',
                            branchName: "${params.BRANCH_NAME}",
                            checkmarxInstallation: CHECKMARX_INSTALLATION,
                            credentialsId: CX_TOKEN,  // use the variable name from withCredentials
                            projectName: CHECKMARX_PROJECT,
                            serverUrl: CHECKMARX_BASE_URL,
                            tenantName: CHECKMARX_TENANT,
                            useOwnAdditionalOptions: true
                    }

                }
            }
        }

    //     stage("Build Docker Image") {
    //         steps {
    //             dir("${env.REPO_NAME}") {
    //                 script {
    //                     if (!fileExists('Dockerfile')) {
    //                         error "❌ Dockerfile not found in ${env.REPO_NAME}!"
    //                     }
    //                     sh """
    //                         docker build -t ${params.IMAGE_NAME}:${env.IMAGE_TAG} .
    //                     """
    //                 }
    //             }
    //         }
    //     }
        
    //     stage("Run Docker Container") {
    //         steps {
    //             sh """
    //                 docker stop $CONTAINER_NAME || true
    //                 docker rm $CONTAINER_NAME || true
    //                 docker run -d -p 4000:3000 --name $CONTAINER_NAME ${IMAGE_NAME}:${IMAGE_TAG}
    //             """
    //         }
    //     }
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
