1. Your repository must contain a production Dockerfile at its root. Launchdeck preserves existing application files and never guesses or overwrites your Dockerfile. For Next.js use output: "standalone" and a multi-stage Dockerfile. For npm repositories with package-lock.json, the Jenkins pipeline installs dependencies and runs any lint and typecheck scripts, then test:ci when present or test with CI=true before building. Configure equivalent required checks for other package managers.

2. The first deployment runs an idempotent host bootstrap over SSH. It supports Ubuntu, Debian, Amazon Linux 2 and Amazon Linux 2023; it installs Docker Engine, Compose v2, Bash, curl and flock, enables Docker, and creates the project directory. The SSH user must have passwordless sudo for first-time setup. The bootstrap adds the user to the docker group; Docker group membership grants root-equivalent access. Match the image architecture to the EC2 processor.

3. On EC2 create $HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.env.production with runtime secrets before the first deploy (chmod 600). Deployment preserves this file. Your app must listen on 0.0.0.0:3000 inside the container and return HTTP 2xx or 3xx from /.

4. Reserve host port 5000 for this project and configure Caddy or Nginx with HTTPS to proxy your domain to 127.0.0.1:5000. Add a domain in project settings to have Launchdeck configure Caddy automatically.

5. Launchdeck does not create AWS instances. Install the Jenkins controller on a separate x86_64 VM using the Launchdeck deploy/jenkins installer, then finish the Jenkins setup wizard. That installer also registers the Docker-enabled launchdeck-docker agent in a separate container and sets controller executors to zero.

6. Provide the dedicated SSH private key and verified known_hosts entry. Verify the host fingerprint through a trusted channel; do not blindly trust ssh-keyscan output. Allow SSH from the Jenkins agent network.

7. Launchdeck stores the SSH key and verified known_hosts entry as project-specific Jenkins credentials and configures a Pipeline job to read the Jenkinsfile from the selected GitHub branch. GitHub access is used only to browse the repository and create the reviewed setup pull request.

8. The setup PR removes this project's generated GitHub Actions deployment workflow so only Jenkins deploys it after the merge.

9. Review and merge the setup PR into main. The Jenkins job polls the selected production branch every two minutes.

10. Public Next.js build variables are baked into the image. Add needed build arguments to your Dockerfile and generated build step before merging. Do not include runtime secrets in the build context; maintain .dockerignore.

11. Jenkins builds the Docker image on its agent and transfers it directly to EC2 over the verified SSH connection, so no GitHub Actions runner or container registry is required. The EC2 host retains prior images for rollback. A single container replacement can briefly interrupt service.

12. The Jenkins controller image installs Pipeline, Git, Folders, SSH Credentials, Credentials Binding and Plain Credentials. Connect it in Launchdeck Settings using its HTTPS URL, a dedicated API service user and API token; the token is encrypted at rest.
