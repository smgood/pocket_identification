import './model.css';

import * as React from 'react';
import * as THREE from 'three';
import { OrbitControls } from '@react-three/drei';
import { Canvas } from '@react-three/fiber';
import { GLTFLoader } from 'three-stdlib';
import GUI from 'lil-gui';
import rgbIdToEntityIdMap from "../../../data_dump/rgb_id_to_entity_id_map.json";

interface ModelEntity {
    bufferGeometry: THREE.BufferGeometry;
    color: THREE.Color;
    entityId: string;
}

// GUI settings for the Three.js scene.
interface Settings {
    mode : displayMode;
};

// Display modes for viewing mesh.
enum displayMode {
    pocket = "Pocket",
    colorMap = "Color Map",
}

// Convert Color to dash seperated string EG: 255-0-100.
function getRgbDashString(color: THREE.Color): string {
    return Math.floor(255 * color.r) + '-'
        + Math.floor(255 * color.g)  + '-'
        + Math.floor(255 * color.b) ;
}

// Get entity's color based on display mode.
function getColor(settings: Settings, entity: ModelEntity): string {
    if (settings.mode == displayMode.colorMap) {
        return entity.color.getStyle();
    }

    return 'rgb(100, 100, 100)';
}

export const Model = (): JSX.Element => {
    const [modelEnts, setModelEnts] = React.useState<ModelEntity[]>([]);
    const [gui, setGui] = React.useState<GUI | null>(null);
    const [settings, setSettings] = React.useState<Settings | null>(null);
    const inputRef = React.useRef(null);

    React.useEffect(() => {
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

        const gui = new GUI( { container: inputRef.current } );
        const settings : Settings = {
            mode: displayMode.pocket,
        };
        setSettings(settings);
        gui.add(settings, 'mode', [displayMode.pocket, displayMode.colorMap])
          	.name('Display mode')
          	.onChange(newValue => {
                setSettings(prevSettings => ({ ...prevSettings, mode: newValue}));
          	});
        setGui(gui);

        return () => {
            gui.destroy();
        };
    }, [])

    return (
        <div className="canvas-container" ref={inputRef}>
            <Canvas camera={{ position: [0, 0, 300] }} >
                <ambientLight />
                <pointLight intensity={0.5} position={[0, 100, 0]} />
                <OrbitControls makeDefault />
                <group>
                    {
                        modelEnts.map((ent, index) => (
                            <mesh
                                geometry={ent.bufferGeometry}
                                key={index}
                            >
                                <meshStandardMaterial color={getColor(settings, ent)} />
                            </mesh>
                        ))
                    }
                </group>
            </Canvas>
        </div>
    )
};
