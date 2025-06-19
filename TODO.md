- minecraft_account wird erst nach directus neustart mit dem user assoziiert.
   hat wahrscheinl. nichts mit user create oder user update zu tun.

- timeout von 3500ms bei oauth getUserId führt zu "invalid credentials" fehler, 
    timeout erhöhen, oder user in action hook / non blocking verknüpfen
    evtl. beides, falls microsoft oder der oidc proxy mal länger braucht


