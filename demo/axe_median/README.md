# Skeleton to OBJ loader

## Arguments

- `input_file`: Path to the input skeleton file (.sdp)
- `output_file`: Path to the output OBJ file

## How it works

1. The script reads the `input_file` line by line.
2. Write `v` (=vector) before each lines to the output file.
3. After writing all vertices, call `addLine` function which creates links (=line) between nearby points and write in the outputFile in the format `l {indexVertice} {indexNeighbourVertices}`.

## [FIX ME] Pipeline GRIM

```
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
```
