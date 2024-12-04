import adjacencyGraph from '../../data_dump/adjacency_graph.json';
import adjacencyGraphEdgeMetadata from '../../data_dump/adjacency_graph_edge_metadata.json';
import entityGeometryInfo from '../../data_dump/entity_geometry_info.json';

export default class PocketDetector {
  entityIds: string[];
  convexEntities: Set<string>;
  pocketCount: number;

  constructor() {
      this.isEntityPartOfPocket = this.isEntityPartOfPocket.bind(this);

      this.entityIds = entityGeometryInfo.map(entity => entity["entityId"]);
      this.convexEntities = new Set<string>(this.entityIds);
      var edges = Object.keys(adjacencyGraphEdgeMetadata);

      // Remove all Convex entities
      for (var i = 0; i < edges.length; i++) {
          if (adjacencyGraphEdgeMetadata[edges[i]].includes(1)) {
              const newEntities = edges[i].split('-');
              this.convexEntities.delete(newEntities[0]);
              this.convexEntities.delete(newEntities[1]);
          }
      }

      this.pocketCount = this.determinePocketCount();
  }

  determinePocketCount(): number {
    var pocketCount = 0;
    var convexEntitiesList = Array.from(this.convexEntities);
    var unvisitedConvexEntities = new Set([...convexEntitiesList]);

    for (var i = 0; i < convexEntitiesList.length; i++) {
        var entityId = convexEntitiesList[i];
        if (unvisitedConvexEntities.has(entityId)){
            pocketCount++;
            this.checkNeighbors(entityId, unvisitedConvexEntities);
        }
    }

    return pocketCount;
  }

  checkNeighbors(currentEntityId, unvisitedConvexEntities) {
      const neighbors = adjacencyGraph[currentEntityId];
      for (var i = 0; i < neighbors.length; i++) {
          var neighborId = neighbors[i];
          if (unvisitedConvexEntities.has(neighborId)) {
              unvisitedConvexEntities.delete(neighborId);
              this.checkNeighbors(neighborId, unvisitedConvexEntities);
          }
      }
  }

  isEntityPartOfPocket(entityId: string): boolean {
      return this.convexEntities.has(entityId);
  }

  getPocketCount(): number {
      return this.pocketCount;
  }
}
