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
            pkgs.bun
        ];
        
        shellHook = ''
          docker compose up --build -d --remove-orphans || true;
          
          # production command
          # docker compose up -d --remove-orphans --build -f compose.yml

          echo "Development environment is up and running!";
          echo "You can access them at the following URLs:";
          echo "  Backend:  http://localhost:8055";
          echo "  Frontend: http://localhost:3000";
        '';
    };	
  };
}