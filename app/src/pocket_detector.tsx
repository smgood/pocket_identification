import adjacencyGraph from '../../data_dump/adjacency_graph.json';
import adjacencyGraphEdgeMetadata from '../../data_dump/adjacency_graph_edge_metadata.json';
import entityGeometryInfo from '../../data_dump/entity_geometry_info.json';

export default class PocketDetector {
  entityIds: string[];
  concaveEntities: Set<string>;
  pocketCount: number;

  constructor() {
      this.isEntityPartOfPocket = this.isEntityPartOfPocket.bind(this);

      this.entityIds = entityGeometryInfo.map(entity => entity["entityId"]);
      this.concaveEntities = new Set<string>(this.entityIds);
      const edges = Object.keys(adjacencyGraphEdgeMetadata);

      // Remove all entities that share a convex edge.
      for (var i = 0; i < edges.length; i++) {
          if (adjacencyGraphEdgeMetadata[edges[i]].includes(1)) {
              const newEntities = edges[i].split('-');
              this.concaveEntities.delete(newEntities[0]);
              this.concaveEntities.delete(newEntities[1]);
          }
      }

      this.pocketCount = this.determinePocketCount();
  }

  determinePocketCount(): number {
    const concaveEntitiesList = Array.from(this.concaveEntities);
    const unvisitedConcaveEntities = new Set([...concaveEntitiesList]);
    var pocketCount = 0;

    for (var i = 0; i < concaveEntitiesList.length; i++) {
        const entityId = concaveEntitiesList[i];
        if (unvisitedConcaveEntities.has(entityId)){
            pocketCount++;
            this.checkNeighbors(entityId, unvisitedConcaveEntities);
        }
    }

    return pocketCount;
  }

  checkNeighbors(currentEntityId, unvisitedConcaveEntities) {
      const neighbors = adjacencyGraph[currentEntityId];
      for (var i = 0; i < neighbors.length; i++) {
          const neighborId = neighbors[i];
          if (unvisitedConcaveEntities.has(neighborId)) {
              unvisitedConcaveEntities.delete(neighborId);
              this.checkNeighbors(neighborId, unvisitedConcaveEntities);
          }
      }
  }

  isEntityPartOfPocket(entityId: string): boolean {
      return this.concaveEntities.has(entityId);
  }

  getPocketCount(): number {
      return this.pocketCount;
  }
}
