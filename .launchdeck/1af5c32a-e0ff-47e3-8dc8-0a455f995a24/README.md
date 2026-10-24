1. Your repository must contain the production Dockerfile Dockerfile, relative to the repository root, with build context . (also relative to the repository root). Launchdeck preserves it and uses Docker to build the application without language-specific commands. Docker builds the final stage by default; set a target when the application is in a named earlier stage. Put dependency installation, compilation and required checks in your Docker build; a successful image build does not imply tests ran unless your Dockerfile runs them.

2. Each deployment runs an idempotent host bootstrap over SSH. It supports Ubuntu, Debian, Amazon Linux 2 and Amazon Linux 2023; it installs Docker Engine, Compose v2, Buildx, Bash, curl and flock, enables Docker, and creates the project directory. The SSH user must have passwordless sudo. The bootstrap adds the user to the docker group; Docker group membership grants root-equivalent access. Match the image architecture to the EC2 processor.

3. Add runtime KEY=value lines in Launchdeck project settings to store them encrypted and install $HOME/.launchdeck/1af5c32a-e0ff-47e3-8dc8-0a455f995a24/.env.production on EC2 with mode 600 during deployment. If no values are saved in Launchdeck, deployment preserves an existing EC2 .env.production file. Runtime values are never put in the setup pull request or Docker image. Your app must listen on 0.0.0.0:8080 inside the container and return HTTP 2xx or 3xx from /.

4. The first deployment automatically configures a shared Caddy reverse proxy for https://lab.mashateayoub.com to 127.0.0.1:5000. Point DNS to this EC2 instance and allow inbound ports 80 and 443. If those ports are already used by another proxy, configure that proxy manually instead.

5. Launchdeck does not create AWS instances. Install the Jenkins controller on a separate x86_64 VM using the Launchdeck deploy/jenkins installer, then finish the Jenkins setup wizard. That installer also registers the Docker-enabled launchdeck-docker agent in a separate container and sets controller executors to zero.

6. Provide the dedicated SSH private key and verified known_hosts entry. Verify the host fingerprint through a trusted channel; do not blindly trust ssh-keyscan output. Allow SSH from the Jenkins agent network.

7. Launchdeck stores the SSH key and verified known_hosts entry as project-specific Jenkins credentials and configures a Pipeline job to read the Jenkinsfile from the selected GitHub branch. GitHub access is used only to browse the repository and create the reviewed setup pull request.

8. The setup PR removes this project's generated GitHub Actions deployment workflow so only Jenkins deploys it after the merge.

9. Review and merge the setup PR into main. The Jenkins job polls the selected production branch every two minutes.

10. The application Dockerfile owns its runtime defaults and build configuration. Supply application-specific runtime variables through EC2 .env.production; Launchdeck does not inject NODE_ENV, HOSTNAME or PORT. Keep secrets outside the build context and maintain .dockerignore.

11. Jenkins builds the Dockerfile image on its agent and transfers it directly to EC2 over the verified SSH connection, so no registry is required. The EC2 host retains the previous image for rollback. A single container replacement can briefly interrupt service.

12. HTTP readiness checks use a 210-second deadline per check, including rollback recovery. The entire Jenkins job has a 30-minute timeout. Allow enough job time for building, deploying and recovering a previous release. After changing build paths or timeout settings, create and merge a new setup PR; saved settings do not rewrite an existing Jenkinsfile.

13. The Jenkins controller image installs Pipeline, Git, Folders, SSH Credentials, Credentials Binding and Plain Credentials. Connect it in Launchdeck Settings using its HTTPS URL, a dedicated API service user and API token; the token is encrypted at rest.
