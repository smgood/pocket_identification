import './model.css';

import * as React from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Canvas, ThreeEvent } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import GUI from 'lil-gui';
import rgbIdToEntityIdMap from '../../../data_dump/rgb_id_to_entity_id_map.json';

interface ModelEntity {
    bufferGeometry: THREE.BufferGeometry;
    color: THREE.Color;
    entityId: string;
}

// GUI settings for the Three.js scene.
interface Settings {
    mode : displayMode;
    transparent : boolean;
};

// Display modes for viewing mesh.
enum displayMode {
    colorMap = 'Color Map',
    pocket = 'Pocket',
}

export const Model = ({pocketCount, getEntityPocketNumber}): JSX.Element => {
    // Determine the opacity of an entity's mesh. If in pocket mode, make entities
    // that are part of a pocket opaque, even if transparent is checked.
    function isMeshTransparent(entity: ModelEntity): boolean {
      if (settings && settings.transparent) {
          return settings.mode != displayMode.pocket || getEntityPocketNumber(entity.entityId) == null
      }

      return false;
    }

    // Convert color to dash seperated string EG: 255-0-100.
    function getRgbDashString(color: THREE.Color): string {
        return Math.floor(255 * color.r) + '-'
            + Math.floor(255 * color.g)  + '-'
            + Math.floor(255 * color.b) ;
    }

    // Get entity's color based on display mode.
    function getColor(entity: ModelEntity): string {
        if (settings.mode == displayMode.colorMap) {
            return entity.color.getStyle();
        }

        const pocketNumber = getEntityPocketNumber(entity.entityId);
        if (pocketNumber != null) {
            if (pocketNumber == selectedPocketNumber) {
                return 'rgb(255,255,0)';
            }
            return 'rgb(255, 0, 0)'
        }
        return 'rgb(150, 150, 150)';
    }

    function createStandardMaterial(entity: ModelEntity) {
        var isTransparent = isMeshTransparent(entity);
        return (
            <meshStandardMaterial
                color={getColor(entity)}
                opacity={isTransparent ? 0.5 : 1.0}
                transparent={true}
                depthWrite={!isTransparent}
            />
        );
    }

    // Create a point light. The position is relative to the camera's position.
    function createPointLight(): THREE.PointLight {
        const light = new THREE.PointLight();
        light.position.set(0, 100, 0);
        light.intensity= 1;
        return light;
    }

    function setupGui() {
      const gui = new GUI({container: inputRef.current});
      const settings : Settings = {
          mode: displayMode.pocket,
          transparent: false,
      };
      setSettings(settings);
      gui.add(settings, 'mode', [displayMode.pocket, displayMode.colorMap])
          .name('Display mode')
          .onChange(newValue => {
              setSettings(prevSettings => ({...prevSettings, mode: newValue}));
          });
      gui.add(settings, 'transparent')
          .name('Transparent')
          .onChange(newValue => {
              setSettings(prevSettings => ({...prevSettings, transparent: newValue}));
          });
      setGui(gui);

      return () => {
          gui.destroy();
      };
    }

    // Assign a random color to each pocket.
    function setupPocketColors() {
        const colors = [];
        for (var i = 0; i < pocketCount; i++) {
            colors.push('rgb('
                + Math.round(Math.random() * 255) + ','
                + Math.round(Math.random() * 255) + ','
                + Math.round(Math.random() * 255) + ')');
        }
        setPocketColors(colors);
    }

    // Highlight pocket when hovered over. onPointerMove event is used instead
    // of onPointerEnter because mesh is determined using a raycast. An occluded
    // mesh could be entered, causing unwanted effects.
    function selectPocket(event: ThreeEvent<PointerEvent>, entityId: string) {
      setSelectedPocketNumber(getEntityPocketNumber(entityId));
      event.stopPropagation()
    }

    function unselectPocket() {
      setSelectedPocketNumber(null);
    }

    const [modelEnts, setModelEnts] = React.useState<ModelEntity[]>([]);
    const [gui, setGui] = React.useState<GUI | null>(null);
    const [settings, setSettings] = React.useState<Settings | null>(null);
    const [pocketColors, setPocketColors] = React.useState<string[]>([]);
    const [selectedPocketNumber, setSelectedPocketNumber] =
        React.useState<number[]>(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        setupGui();
        setupPocketColors();

        new GLTFLoader().load('./colored_glb.glb', gltf => {
            const newModuleEntities: ModelEntity[] = [];
            gltf.scene.traverse(element => {
                if (element.type !== 'Mesh') return;

                const meshElement = element as THREE.Mesh;
                const geometry = meshElement.geometry as THREE.BufferGeometry;
                const material = meshElement.material as THREE.MeshStandardMaterial;
                const color = material.color as THREE.Color;
                const entityId = rgbIdToEntityIdMap[getRgbDashString(color)];
                newModuleEntities.push({
                    bufferGeometry: geometry,
                    color: color,
                    entityId: entityId,
                });
            });
            setModelEnts(newModuleEntities);
        });
    }, [])

    return (
        <div className="canvas-container" ref={inputRef}>
            <Canvas camera={{position: [300, 300, 0]}}
                onCreated={({camera, scene}) => {
                    camera.add(createPointLight());
                    scene.add(camera);
                }}
            >
                <ambientLight intensity={0.5} />
                <OrbitControls makeDefault />
                <group>
                    {
                        modelEnts.map((ent, index) => (
                            <mesh
                                geometry={ent.bufferGeometry}
                                key={index}
                                onPointerMove={(event) => selectPocket(event, ent.entityId)}
                                onPointerLeave={() => unselectPocket()}
                            >
                                {createStandardMaterial(ent)}
                            </mesh>
                        ))
                    }
                </group>
            </Canvas>
        </div>
    )
};
