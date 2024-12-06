# This project identifies the number of pockets in a 3d object.

## Instructions

Run `npm start` to set up a node server.

## Settings

### Display Modes

- Pockets (Default): Display pockets in red. When hovering over a pocket, highlight it in yellow.
- Pockets (Random Color): To help differentiate pockets, display each pocket in a randomly generated color.
- Color Map: Display each entity with its assigned unique color. When hovering over an entity, highlight it in yellow and display the entity id below for testing purposes.

### Options

- Transparent: If checked, meshes will be transparent. However, if pocket mode is selected, the pockets will remain opaque.

## Files of interest

1. app/src/index.tsx: This is the root of the react application.

2. app/src/pocket_detector.tsx: This class determines how many pockets exist in the 3d object and which entities are a part of each pocket. This is computed by identifying entities with concave edges and grouping neighboring entities into buckets.

3. app/src/model/model.tsx: This element renders the model defined in the colored_glb.glb file in a three.js scene. Settings are provided via a lil-gui panel.

## Additional potential features

Below are some potential features for future development.

### Improve pocket identification algorithm.
      - Use normals to identify pockets. Walls in a 3d pocket have face normals that are all coplanar.
      - Solve for the edge case where there is a hole composed of a single cylindrical face.

### Add features to improve model visualization.
      - To better differentiate pockets, add an outline of each pocket. That way the user can differentiate between pockets that are touching each other without having to hover over the pocket.
      - Improve the transparency setting. There seems to be a minor bug with the rendering.
      - Add other display modes in Gui such as wireframe and metallic material.
      - Add option to display scene in full screen mode.
      - Improve random color pocket mode by making sure conflicting colors are not randomly generated.

### Add testing features
      - Create additional glb files and corresponding data files to manually test other 3d objects.
      - Add unit tests for pocket detection functions and screenshot tests for visualization.
      - Create a list view that displays the entities that make up each pocket. When hovering over a list, highlight the corresponding pocket.
      - Add option to display surface normals via arrows.
