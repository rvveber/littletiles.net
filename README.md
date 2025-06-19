# Contributing
We're using flakes to manage the development environment reproducable and encapsulated.

### To contribute to this project, please follow these steps:
1. **Clone the repository**:
   ```bash
   git clone https://github.com/rvveber/littletiles.net.git
    ```
2. **Install Nix**:
   Follow the instructions on the [Nix website](https://nixos.org/download.html) to install Nix.

3. **Enable Nix Flakes**:
   Add the following to your ~/.config/nix/nix.conf or /etc/nix/nix.conf:
   ```ini
   experimental-features = nix-command flakes
   ```
4. **Prepare .env**:
   Copy .env.template to .env and specify the secrets
5. **Enter the development shell**:
   ```bash
   nix develop
   ```

Done! <br>
Both Frontend and Backend support hot reloading!


<br>
<br>

# Deploying in Production
### Via Docker Compose

```sh
docker compose --file compose.yml up -d --build --remove-orphans
```

