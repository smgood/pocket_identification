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
    material: THREE.MeshStandardMaterial;
}

// GUI settings for the Three.js scene.
interface Settings {
    mode : displayMode;
    transparent : boolean;
};

// Display modes for viewing mesh.
enum displayMode {
    colorMap = 'Color Map',
    pocket = 'Pockets (Default)',
    randomPocketColor = 'Pockets (Random Color)'
}

// Material colors for entities.
const pocketColor = 'rgb(255, 0, 0)';
const highlightColor = 'rgb(255, 255, 0)';
const defaultColor = 'rgb(150, 150, 150)';

export const Model = ({
    pocketCount,
    getEntityPocketNumber,
    onUpdateSelectedEntity}): JSX.Element => {
    // Determine if a mesh is transparent. If in pocket mode, make entities that
    // are part of a pocket opaque, even if transparent setting is checked.
    function isMeshTransparent(entityId: string): boolean {
        if (settings.transparent) {
            return settings.mode == displayMode.colorMap ||
                getEntityPocketNumber(entityId) == null;
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
            return entity.entityId == selectedEntityId
                ? highlightColor
                : entity.color.getStyle();
        }

        const pocketNumber = getEntityPocketNumber(entity.entityId);
        if (pocketNumber != null) {
            if (pocketNumber == selectedPocketNumber) {
                return highlightColor;
            }
            if (settings.mode == displayMode.randomPocketColor) {
                return pocketColors[pocketNumber];
            }
            return pocketColor;
        }
        return defaultColor;
    }

    // Return the entity's material with updated color and transparency set.
    function getMaterial(entity: ModelEntity): THREE.MeshStandardMaterial {
        const material = entity.material;
        const isTransparent = isMeshTransparent(entity.entityId);

        // The transparency of a material can't be easily changed at runtime. It
        // requires `material.needsUpdate` to be called.
        // https://threejs.org/docs/#manual/en/introduction/How-to-update-things
        material.needsUpdate = material.transparent != isTransparent;

        material.color=new THREE.Color(getColor(entity));
        material.opacity= isTransparent ? 0.5 : 1.0;
        material.transparent= isTransparent;
        material.depthWrite= !isTransparent;
        return material;
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
            transparent: true,
        };
        setSettings(settings);
        gui.add(settings, 'mode', [
            displayMode.pocket,
            displayMode.randomPocketColor,
            displayMode.colorMap])
            .name('Display mode')
            .onChange(newValue => {
                setSettings(prevSettings => ({...prevSettings, mode: newValue}));
            });
        gui.add(settings, 'transparent')
            .name('Transparent')
            .onChange(newValue => {
                setSettings(prevSettings =>
                    ({...prevSettings, transparent: newValue}));
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
                + getRandomNumber() + ','
                + getRandomNumber() + ','
                + getRandomNumber() + ')');
        }
        setPocketColors(colors);
    }

    // Generate random whole number from 0 to 255.
    const getRandomNumber = (): number => Math.floor(Math.random() * 256);

    // Highlight pocket when hovered over. onPointerMove event is used instead
    // of onPointerEnter because mesh is determined using a raycast. An occluded
    // mesh could be entered, causing unwanted effects.
    function selectEntity(event: ThreeEvent<PointerEvent>, entityId: string) {
        if (settings.mode == displayMode.colorMap ||
            !settings.transparent ||
            getEntityPocketNumber(entityId) != null) {
            setSelectedEntityId(entityId);
            setSelectedPocketNumber(getEntityPocketNumber(entityId));
            event.stopPropagation()
        }

        if (settings.mode == displayMode.colorMap) {
            onUpdateSelectedEntity(entityId);
        }
    }

    function unselectEntity() {
        setSelectedEntityId(null);
        setSelectedPocketNumber(null);

        if (settings.mode == displayMode.colorMap) {
            onUpdateSelectedEntity(null);
        }
    }

    const [modelEnts, setModelEnts] = React.useState<ModelEntity[]>([]);
    const [gui, setGui] = React.useState<GUI | null>(null);
    const [settings, setSettings] = React.useState<Settings | null>(null);
    const [pocketColors, setPocketColors] = React.useState<string[]>([]);
    const [selectedEntityId, setSelectedEntityId] =
        React.useState<string>(null);
    const [selectedPocketNumber, setSelectedPocketNumber] =
        React.useState<number>(null);
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
                const material =
                    meshElement.material as THREE.MeshStandardMaterial;
                const color = material.color as THREE.Color;
                const entityId = rgbIdToEntityIdMap[getRgbDashString(color)];
                newModuleEntities.push({
                    bufferGeometry: geometry,
                    color: color,
                    entityId: entityId,
                    material: new THREE.MeshStandardMaterial(),
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
                                material={getMaterial(ent)}
                                onPointerMove={(event) =>
                                    selectEntity(event, ent.entityId)}
                                onPointerLeave={() => unselectEntity()}
                            >
                            </mesh>
                        ))
                    }
                </group>
            </Canvas>
        </div>
    )
};
