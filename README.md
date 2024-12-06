# This project identifies the number of pockets in a 3d object.

## Instructions

Run `npm start` to set up a node server.

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
      - Color each pocket individually to better identify pockets.
      - Improve the transparency setting. There are currently minor issues with rendering.
      - Support raycast in the scene. Show info that may be helpful to the user such as entity number, rgb value, and number of entities in the pocket.
      - Create a list view that displays the entities in each pocket, and highlights a pocket on hover.
      - Add other display modes in Gui such as wireframe and metallic material.
      - Add option to display surface normals via arrows.
      - Add option to display scene in full screen mode.

### Add testing features
      - Create additional glb files and corresponding data files to manually test other 3d objects.
      - Add unit tests for pocket detection functions and screenshot tests for visualization.
