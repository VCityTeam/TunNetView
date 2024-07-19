
# Contenu de l'archive

- deux axes médians générés par le pipeline invoqué par 
  `grim-run-B.sh  cave_sub_1_grid_size_x_1_grid_size_y_1_no_boundaries_triangulation.obj`

  - "skel.sdp" : axe médian brut dans le système de coordonnées voxélique

  - "skel.sdp.scaled.sdp" : axe médian dans le système de coordonnées du
     maillage initial ; il est produit par la commande
     `python3  skel_scale_offset.py  skel.sdp  1.04167  32  -0  4.92224`
     (commande intégrée au pipeline)

- le script de conversion de l'axe médian brut dans le système de coordonnées
  du maillage (`skel_scale_offset.py`)


