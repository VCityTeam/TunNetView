import { loadMultipleJSON } from '@ud-viz/utils_browser';
import * as proj4 from 'proj4';
import { PointCloudVisualizer } from '@ud-viz/point_cloud_visualizer';
import { LayerChoice } from '@ud-viz/widget_layer_choice';
import { C3DTiles } from '@ud-viz/widget_3d_tiles';
import { initScene } from '@ud-viz/utils_browser';
import * as itowns from 'itowns';

// The PointCloudVisualizer widget stores the current camera position within
// the local storage so that the rendering remains unchanged on scene reload.
// Inhibit this feature for the time being.
localStorage.clear();

loadMultipleJSON([
  './assets/config/extents.json',
  './assets/config/crs.json',
  './assets/config/layer/3DTiles_point_cloud.json',
  './assets/config/layer/3DTiles.json',
  './assets/config/layer/elevation.json',
  './assets/config/layer/base_maps.json',
])
  .then((configs) => {
    proj4.default.defs(
      configs['crs'][0].name,
      configs['crs'][0].transform
    );

    /////////////////////////////////////////////////////////////////////////
    // The application is build on top of the PointCloudVisualizer() class

    // Default size at which any point of the point cloud shall be rendered.
    // This should not be a constant but it should depend on the point cloud
    // bounding box size and some "density" criteria of the points within that
    // bounding box.
    const DEFAULT_POINT_SIZE = 0.1;

    // The geographical extent is set through the configuration files
    const extent = new itowns.Extent(
      configs['extents'][0].name,
      parseInt(configs['extents'][0].west),
      parseInt(configs['extents'][0].east),
      parseInt(configs['extents'][0].south),
      parseInt(configs['extents'][0].north)
    );

    // The point cloud that the application proposes to explore is by default
    // the one designated by the 3DTiles_point_cloud.json asset file:
    const exploredPointCloud = configs['3DTiles_point_cloud'];

    ///// Eventually, create the PointCloudVisualizer "application" with all
    // the above parameters.
    const app = new PointCloudVisualizer(
      extent,
      exploredPointCloud,
      {
        parentDomElement: document.body,
        domElementClass: 'full_screen',
        defaultPointCloudSize: DEFAULT_POINT_SIZE,
        maxSubdivisionLevel: 7,
        c3DTilesLoadingDomElementClasses: ['centered', 'loading'],
        camera: {
          default: {
            position: {
              x: 1841881.83,
              y: 5175148.70,
              z: 300.00,
            },
          },
        },
        measure: true,
      }
    );

    ////////////////////////////////////////////////////////////////////// 
    // Add the layers required by the scene
    // Start with the elevation layer
    const isTextureFormat =
      configs['elevation']['format'] == 'image/jpeg' ||
      configs['elevation']['format'] == 'image/png';
    app.itownsView.addLayer(
      new itowns.ElevationLayer(
        configs['elevation']['layer_name'],
        {
          useColorTextureElevation: isTextureFormat,
          colorTextureElevationMinZ: isTextureFormat
            ? configs['elevation']['colorTextureElevationMinZ']
            : null,
          colorTextureElevationMaxZ: isTextureFormat
            ? configs['elevation']['colorTextureElevationMaxZ']
            : null,
          source: new itowns.WMSSource({
            extent: extent,
            url: configs['elevation']['url'],
            name: configs['elevation']['name'],
            crs: extent.crs,
            heightMapWidth: 256,
            format: configs['elevation']['format'],
          }),
        }
      )
    );

    // Add basemaps
    configs['base_maps'].forEach((baseMapConfig) => {
      app.itownsView.addLayer(
        new itowns.ColorLayer(baseMapConfig.name, {
          updateStrategy: {
            type: itowns.STRATEGY_DICHOTOMY,
            options: {},
          },
          name: baseMapConfig.name,
          source: new itowns.WMSSource({
            extent: extent,
            name: baseMapConfig.source.name,
            url: baseMapConfig.source.url,
            version: baseMapConfig.source.version,
            crs: extent.crs,
            format: baseMapConfig.source.format,
          }),
          transparent: true,
        })
      );
    });

    // Add surfacic/triangulation 3D_tiles
    // PointCloudVisualizer widget deals with 3DTiles that package point clouds.
    // Addding 3DTiles that package triangulation/surfaces must be done 
    // separatly because e.g. the PointCloudVisualizer widget  doesn't require 
    // the setting of an ambiant light (points do not need to be lit by ambiant
    // lights but are just colored vertices). 
     configs['3DTiles'].forEach((layerConfig) => {
      itowns.View.prototype.addLayer.call(
        app.itownsView,
        new itowns.C3DTilesLayer(
          layerConfig['id'],
          {
            name: layerConfig['id'],
            source: new itowns.C3DTilesSource({
              url: layerConfig['url'],
            }),
          },
          app.itownsView,
        )
      );
    });
    // FIXME FIXME
    // 1. mettre le C3DTilesLayer dans une variable.C3DTiles
    // 2. ajouter un listener sur l'evenement On_tile_content_loaded (regarder
    //    dans itowns ou udvis)
    // 3. une fois chargé, dans la callback aller chercher le layer.root
    //    en faire le traverse sur les children du root, aller chercher le
    //    materiel, en changer la composante side doubleside !!!!!!!!! 

    // initScene() is here used on the sole purpose of defining an ambient light.
    initScene(
      app.itownsView.camera.camera3D,
      app.itownsView.mainLoop.gfxEngine.renderer,
      app.itownsView.scene
    )

    /////////////////////////////////////////////////////////////////////////
    // Build the ui (with the help of widgets)
    const ui = document.createElement('div');
    ui.classList.add('ui');
    document.body.appendChild(ui);

    ///// Mouse speed controls
    ui.appendChild(app.domElementSpeedControls);
    // drag element
    app.domElementTargetDragElement.classList.add('drag_element');
    ui.appendChild(app.domElementTargetDragElement);
    // measure
    ui.appendChild(app.measureDomElement);
    // camera near far
    ui.appendChild(app.clippingPlaneDetails);

    //////// Widget allowing to provide an URL of a 3DTiles tileset
    const uiDomElement = document.createElement('div');
    uiDomElement.classList.add('full_screen');
    ui.appendChild(uiDomElement);

    const widget3dTilesThroughURL = new C3DTiles(app.itownsView, {
      parentElement: uiDomElement,
      // We wish to use @ud-viz/widget_layer_choice for listing the layers: 
      displayExistingLayers: false,
    });
    widget3dTilesThroughURL.domElement.setAttribute('id', 'widgets-3dtiles');

    ///////// Add a layer choice widget
    const layerChoice = new LayerChoice(app.itownsView,);
    layerChoice.domElement.classList.add('widget_layer_choice');

    const uiLayerChoiceDomElement = document.createElement('div');
    uiLayerChoiceDomElement.classList.add('full_screen');
    uiDomElement.appendChild(uiLayerChoiceDomElement);

    uiLayerChoiceDomElement.appendChild(layerChoice.domElement);

    // eslint-disable-next-line no-constant-condition
    if ('RUN_MODE' == 'production')
      loadingScreen(app.itownsView, ['UD-VIZ', 'UDVIZ_VERSION']);

    window.addEventListener('keydown', (event) => {
      if (event.key == 'p') console.log(app);
    });

    ///////////////////////////////////////////////////////////////////////
    // When getting close to subterranean objects, hide other objects.
    // Because this PointCloudVisualizer based application is dedicated/specific
    // to visualizing 3DTileset of tunnels and caves the geometric structures
    // of interest will (most often) be subterrenean. This pauses the difficulty
    // of having to deal with either viewing the terrain (and hidding the
    // subterranean structures of interest) or viewing the subterranean 
    // structures (while visually setting aside the terrain).
    // The empirical balance (between terrain and subterranean structure) we 
    // use uses a distance criteria and goes:
    // * when we get close "enough" to the subterranean strucutre we want to 
    //   facilitate the view of the tileset by automatically making the natural 
    //   terrain transparent. 
    // * when getting away far "enough" from the tileset when want to privilege
    //   the viewing of the terrain and thus to restore the inital value of 
    //   the opacity of the terrain.

    function isCameraInsideZoneOfInterest(app) {
      // Consider the first point cloud managed by the PointCloudVisualizer
      // and compute the center of its bounding box.
      if (typeof app.pointCloudLayers[0] === 'undefined') {
        console.log("Unfound point cloud.");
        return false;
      }
      if (typeof app.pointCloudLayers[0].root === 'undefined') {
        console.log("Unfound rootTile.");
        return false;
      }
      const rootTile = app.pointCloudLayers[0].root;
      const rootTilePosition = rootTile.position;
      const rootTileBox = rootTile.boundingVolume.box;
      var boxMin = rootTileBox.min.clone();
      var boxMax = rootTileBox.max.clone();
      var boxCenter = boxMin.add(boxMax).multiplyScalar(1 / 2);
      boxCenter = boxCenter.add(rootTilePosition);

      // Define some notion of the size/dimensions of the bounding box of the 
      // tileset:
      const boxDiagonal = boxMax.sub(rootTileBox.min).length();

      // When we are close enough (using some empirical criteria) when change
      // the opacity of the terrain layer
      const cameraPosition = app.orbitControls.object.position;
      const closeEnough = cameraPosition.distanceTo(boxCenter) - boxDiagonal;

      if (closeEnough < 0.) {
        return true;
      }
      return false;
    }

    // Within the context of this PointCloudVisualizer based app, the terrain
    // is represented by PointCloudVisualizer::itownsView.tileLayer. Hence the
    // name of the variable whose purpose is to store the value of the layer
    // opacity on entry (of the zone of interest) in order to restore it on 
    // exit (from the zone of interest):
    var planarViewOpacityOnEntry = 1.0; // In theory, it could be any value.
    var outsideOfZoneOfIntererst = isCameraInsideZoneOfInterest(app);

    app.orbitControls.addEventListener('change', (event) => {

      if (isCameraInsideZoneOfInterest(app)) {
        if (outsideOfZoneOfIntererst) {
          // We were outside of the zone of interest and we are entering it.
          // Store the on-entry terrain opacity and make the terrain almost
          // transparent.
          outsideOfZoneOfIntererst = false;
          planarViewOpacityOnEntry = app.itownsView.tileLayer.opacity;
          app.itownsView.tileLayer.opacity = 0.2;
          return;
        }
      } else {
        // The camera is outside the zone of interest
        if (!outsideOfZoneOfIntererst) {
          // We were inside the zone of interest and we are exiting from it.
          // Restore the initial value of the opacity.
          outsideOfZoneOfIntererst = true;
          app.itownsView.tileLayer.opacity = planarViewOpacityOnEntry;
          planarViewOpacityOnEntry = -1.0;   // On debug purposes
          return;
        }
      }
      // There was no contradiction between where we thought we were (be it
      // outside of inside) and were we are. We thus didn't cross the ZOI
      // border and hence the opacity remains unchanged.

      if (event.key == 'p') console.log(app)
    });


  });