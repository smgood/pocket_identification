import adjacencyGraphEdgeMetadata from '../../data_dump/adjacency_graph_edge_metadata.json';

// Determine how many pockets exist and which entities are a part of each
// pocket.
export default class PocketDetector {
    // A map to track concave edge relationships between entities. Each
    // key is an entityId that has at least one concave edge. Its associated
    // value is a list of entityIds that share those edges.
    private concaveEntitiesMap: Map<string, string[]>;
    // A list of pockets. Each pocket is represented as a list of the entityIds
    // it is composed of.
    private pockets: string[][];
    // A map of all entities that are part of a pocket. Each key is an entityId.
    // Each value is a number which represents which pocket the entity is part
    // of.
    private entitiesPartOfPockets: Map<string, number>

    constructor() {
        this.getEntityPocketNumber = this.getEntityPocketNumber.bind(this);

        this.createConcaveEntitiesMap();
        this.createPocketList();
        this.createEntitiesPartOfPocketsList();
    }

    // Create private variable concaveEntitiesMap. Traverse through all edges
    // and filter for entities with concave GraphEdgeType.
    private createConcaveEntitiesMap() {
        this.concaveEntitiesMap = new Map<string, string[]>();
        const edges = Object.keys(adjacencyGraphEdgeMetadata);
        for (const edge of edges) {
            if (adjacencyGraphEdgeMetadata[edge].includes(0)) {
                const newEntities = edge.split('-');
                const entity0 = newEntities[0];
                const entity1 = newEntities[1];

                if (this.concaveEntitiesMap.get(entity0)) {
                    this.concaveEntitiesMap.get(entity0).push(entity1);
                } else {
                    this.concaveEntitiesMap.set(entity0, [entity1]);
                }
            }
        }
    }

    // Create private variable pockets. The algorithm uses a traveling salesman
    // type approach where it traverses across shared concave edges to determine
    // each group of entities that makes up a pocket.
    private createPocketList() {
        this.pockets = [];
        const concaveEntities = Array.from(this.concaveEntitiesMap.keys());
        const unvisitedConcaveEntities = new Set([...concaveEntities]);

        for (const entityId of concaveEntities) {
            if (unvisitedConcaveEntities.has(entityId)){
                unvisitedConcaveEntities.delete(entityId);
                const entitiesInPocket = [entityId];
                this.checkNeighbors(
                    entityId,
                    unvisitedConcaveEntities,
                    entitiesInPocket
                );
                this.pockets.push(entitiesInPocket);
            }
        }
    }

    // Helper function that checks each of the entities with a shared convex
    // edge. This is used to determine each group of entities that makes up a
    // pocket.
    private checkNeighbors(
        entityId: string,
        unvisitedConcaveEntities: Set<string>,
        entitiesInPocket: string[]) {
        const neighbors = this.concaveEntitiesMap.get(entityId);
        for (const neighborId of neighbors) {
            if (unvisitedConcaveEntities.has(neighborId)) {
                unvisitedConcaveEntities.delete(neighborId);
                entitiesInPocket.push(neighborId);
                this.checkNeighbors(
                    neighborId,
                    unvisitedConcaveEntities,
                    entitiesInPocket
                );
            }
        }
    }

    // Create private variable entitiesPartOfPockets.
    private createEntitiesPartOfPocketsList() {
        this.entitiesPartOfPockets = new Map<string, number>();
        for (var i = 0; i < this.pockets.length; i++) {
            var pocket = this.pockets[i];
            for (const entityId of pocket) {
                  this.entitiesPartOfPockets.set(entityId, i);
            }
        }
    }

    // Returns whether an entity is part of a pocket.
    private isEntityPartOfPocket = (entityId: string): boolean =>
        this.entitiesPartOfPockets.has(entityId);

    // Returns the pocket number for an entity. This number used to identity
    // which pocket the entity is in.
    public getEntityPocketNumber = (entityId: string): number =>
        this.isEntityPartOfPocket(entityId)
            ? this.entitiesPartOfPockets.get(entityId)
            : null;

    // Returns the total number of pockets in the 3d object.
    public getPocketCount = (): number => this.pockets.length;
}
