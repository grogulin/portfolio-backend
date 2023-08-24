pipeline {
  agent any
  
    stages {
        stage('Checkout') {
            steps {
                git branch: 'main',
                    credentialsId: 'git_credentials',
                    url: 'https://github.com/grogulin/portfolio-backend.git'
            }
        }
     
        stage('Test') {
            
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'postgresql_dev', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASSWORD')
                    ]) {
                    
                    script {
                        
                        def envContent = """
EXPRESSJS_PORT=7011
SEQUELIZE_PORT=7012
DB_HOST=152.67.72.136
DB_PORT=5432
DB_NAME=portfolio_dev
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=jwt_secret_for_testing_purposes
DISABLE_NEW_USERS=false
                        """
                        
                        sh "echo '${envContent}' > .env"

                        
                    }
                    
                    // move project to test_env folder
                    sshagent(['oracle']) {
                        sh 'ssh -o StrictHostKeyChecking=no ubuntu@152.67.72.136 "rm -rf apps/test_env/portfolio-backend/*"'
                        sh 'scp -o StrictHostKeyChecking=no -r ./* ubuntu@152.67.72.136:apps/test_env/portfolio-backend/'
                        sh 'scp -o StrictHostKeyChecking=no -r ./.env ubuntu@152.67.72.136:apps/test_env/portfolio-backend/'
                    }

                    // Install with dev dependencies
                    sshagent(['oracle']) {
                        sh 'ssh -o StrictHostKeyChecking=no ubuntu@152.67.72.136 "cd apps/test_env/portfolio-backend/ && npm install --production=false"'
                        sh 'ssh -o StrictHostKeyChecking=no ubuntu@152.67.72.136 "cd apps/test_env/portfolio-backend/ && npm test"'
                    }

                    // Clean up
                    sshagent(['oracle']) {
                        sh 'ssh -o StrictHostKeyChecking=no ubuntu@152.67.72.136 "rm -rf apps/test_env/portfolio-backend/*"'
                    }
                }
            }
        }

        stage('Deploy') {
            
            steps {
                withCredentials([
                    usernamePassword(credentialsId: 'postgresql_prod', usernameVariable: 'DB_USER', passwordVariable: 'DB_PASSWORD'),
                    string(credentialsId: 'portfolio_jwt_secret', variable: 'JWT_SECRET')
                    ]) {
                    
                    script {
                        
                        def envContent = """
EXPRESSJS_PORT=7011
SEQUELIZE_PORT=7012
DB_HOST=152.67.72.136
DB_PORT=5432
DB_NAME=portfolio_prod
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
JWT_SECRET=$JWT_SECRET
DISABLE_NEW_USERS=${DISABLE_NEW_USERS}
                        """
                        
                        sh "echo '${envContent}' > .env"

                        
                    }
                    
                    sshagent(['oracle']) {
                        sh 'ssh -o StrictHostKeyChecking=no ubuntu@152.67.72.136 "pm2 stop portfolio-backend || true && rm -rf apps/portfolio-backend/*"'
                        sh 'scp -o StrictHostKeyChecking=no -r ./* ubuntu@152.67.72.136:apps/portfolio-backend/'
                        sh 'scp -o StrictHostKeyChecking=no -r ./.env ubuntu@152.67.72.136:apps/portfolio-backend/'
                    }
        
                    sshagent(['oracle']) {
                        sh 'ssh -o StrictHostKeyChecking=no ubuntu@152.67.72.136 "cd apps/portfolio-backend/ && npm install --production"'
                        sh 'ssh -o StrictHostKeyChecking=no ubuntu@152.67.72.136 "cd apps/portfolio-backend/ && pm2 start ./bin/www --name portfolio-backend"'
                    }
                }
            }
        }
    }
}