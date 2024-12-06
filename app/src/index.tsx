import PocketDetector from './pocket_detector';
import React from 'react';
import ReactDOM from 'react-dom';
import { Model } from './model/model';

function App() {
    const [selectedEntityId, setSelectedEntityId] =
        React.useState<string>(null);
    const pocketDetector = new PocketDetector();

    // Event handler to update selected entity id.
    const handleUpdateSelectedEntity = (entityId) => {
        setSelectedEntityId(entityId);
    };

    // Render selected entity id.
    const getSelectedEntityId = () =>
        selectedEntityId != null
            ? (<div>Entity id: {selectedEntityId}</div>)
            : (<span></span>);

    return (
        <React.Fragment>
            <span>Pocket Detection</span>
            <Model
                getEntityPocketNumber={pocketDetector.getEntityPocketNumber}
                pocketCount={pocketDetector.getPocketCount()}
                onUpdateSelectedEntity={handleUpdateSelectedEntity}
            />
            <div>Pocket Count: {pocketDetector.getPocketCount()}</div>
            {getSelectedEntityId()}
        </React.Fragment>
    );
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
