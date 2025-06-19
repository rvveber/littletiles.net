{
  description = "LittleTiles.net development environment";

  inputs = {
    nixpkgs.url = "github:nixos/nixpkgs?ref=nixos-unstable";
  };

  outputs = { self, nixpkgs }:
  let
    system = "x86_64-linux";
    pkgs   = nixpkgs.legacyPackages.${system};

    # ─────────────────── Haupt-Command "dev" ───────────────────
    devScript = pkgs.writeShellScriptBin "dev" ''
      set -euo pipefail

      cmd="''${1:-}"   # start | stop | restart | logs | empty
      target="''${2:-}"   # optional container name (may be empty)

      usage() {
        echo "Usage: dev {start|stop|restart|logs} [container]" >&2
        exit 1
      }

      compose() {
        if [ -n "$target" ]; then
          docker compose "$@" "$target"
        else
          docker compose "$@"
        fi
      }

      case "$cmd" in
        start)   compose up --build -d --remove-orphans ;;
        stop)    compose stop                          ;;
        restart) compose restart                       ;;
        logs)    compose logs -f                       ;;
        *)       usage                                 ;;
      esac
    '';

    # ──────────────── Autocompletion (bash) ────────────────
    devCompletion = pkgs.writeText "dev-completion.bash" ''
      _dev_complete() {
        local cur prev
        COMPREPLY=()
        cur="''${COMP_WORDS[COMP_CWORD]}"
        prev="''${COMP_WORDS[COMP_CWORD-1]}"

        local actions="start stop restart logs"

        if [[ $COMP_CWORD -eq 1 ]]; then
          COMPREPLY=( $(compgen -W "$actions" -- "$cur") )
        else
          # try to list compose services only once; cache in array
          local services
          services=$(docker compose config --services 2>/dev/null)
          COMPREPLY=( $(compgen -W "$services" -- "$cur") )
        fi
        return 0
      }
      complete -F _dev_complete dev
    '';

    # ───────── Binär-Kurzschalter (0 / 1 / 01) ─────────
    oneScript      = pkgs.writeShellScriptBin "1"  ''exec dev start    "$@"'';
    zeroScript     = pkgs.writeShellScriptBin "0"  ''exec dev stop     "$@"'';
    oneZeroScript  = pkgs.writeShellScriptBin "01" ''exec dev restart  "$@"'';
  in
  {
    # ───────────────────────── Dev-Shell ─────────────────────────
    devShells.${system}.default = pkgs.mkShell {
      nativeBuildInputs = [
        pkgs.bashInteractive
        pkgs.docker
        pkgs.bun
        devScript oneScript zeroScript oneZeroScript
      ];

      shellHook = ''
        # Banner
        cat <<'EOF'
╭─────────────────────────────────────────╮
│  LittleTiles.net Dev-Shell              │
│                                         │
│  Befehle:                               │
│    dev start [container]                │
│    dev stop  [container]                │
│    dev restart [container]              │
│    dev logs   [container]               │
│                                         │
│    1   → dev start                      │
│    0   → dev stop                       │
│    01  → dev restart                    │
╰─────────────────────────────────────────╯
EOF

        # Komfort-Alias für dev
        alias dev="nix run .#dev --"

        # Bash-Completion laden (funktioniert nur, wenn bashInteractive)
        if [[ -n "''${BASH_VERSION:-}" ]]; then
          source ${devCompletion}
        fi
      '';
    };

    # ───────────────────────── Packages ─────────────────────────
    packages.${system} = {
      dev = devScript;
      dev-completion = devCompletion;
      "1"  = oneScript;
      "0"  = zeroScript;
      "01" = oneZeroScript;
    };

    # ─────────────────────────── App ───────────────────────────
    apps.${system}.default = {
      type = "app";
      program = "${devScript}/bin/dev";
      meta.description = "Multipurpose dev helper (start/stop/restart/logs).";
    };
  };
}
