{
  description = "Basic Development Nix Shell - run with 'nix develop'";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
  let
        system = "x86_64-linux";
        pkgs = nixpkgs.legacyPackages.${system};
  in {
    devShells.${system}.default = pkgs.mkShell {
        
        buildInputs = [
            pkgs.docker
            pkgs.docker-buildx
            pkgs.bun
        ];
        
        shellHook = ''
            export COMPOSE_BAKE=true;
            export DOCKER_BUILDKIT=1;

            docker compose up -d --build || true;        
        '';

    };	
  };
}