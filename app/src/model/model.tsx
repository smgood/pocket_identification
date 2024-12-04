import './model.css';

import * as React from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
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

export const Model = ({isEntityPartOfPocket}): JSX.Element => {
    /*
    Determine the opacity of an entity's mesh. If in pocket mode, make entities
    that are part of a pocket opaque, even if transparent is checked. 
    */
    function isMeshTransparent(entity: ModelEntity): boolean {
      if (settings && settings.transparent) {
          return settings.mode != displayMode.pocket || !isEntityPartOfPocket(entity.entityId)
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

        // Color entities part of a pocket red.
        return isEntityPartOfPocket(entity.entityId)
            ? 'rgb(255, 0, 0)'
            : 'rgb(150, 150, 150)';
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
              setSettings(prevSettings => ({ ...prevSettings, mode: newValue}));
          });
      gui.add(settings, 'transparent')
          .name('Transparent')
          .onChange(newValue => {
              setSettings(prevSettings => ({ ...prevSettings, transparent: newValue}));
          });
      setGui(gui);

      return () => {
          gui.destroy();
      };
    }

    const [modelEnts, setModelEnts] = React.useState<ModelEntity[]>([]);
    const [gui, setGui] = React.useState<GUI | null>(null);
    const [settings, setSettings] = React.useState<Settings | null>(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
        setupGui();

        new GLTFLoader().load('./colored_glb.glb', gltf => {
            const newModuleEntities: ModelEntity[] = [];
            gltf.scene.traverse(element => {
                if (element.type !== 'Mesh') return;

                const meshElement = element as THREE.Mesh;
                const material = meshElement.material as THREE.MeshStandardMaterial;
                const color = material.color as THREE.Color;
                const entityId = rgbIdToEntityIdMap[getRgbDashString(color)];
                newModuleEntities.push({
                    bufferGeometry: meshElement.geometry as THREE.BufferGeometry,
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
