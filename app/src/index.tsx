import PocketDetector from './pocket_detector';
import React from 'react';
import ReactDOM from 'react-dom';
import { Model } from './model/model';

function App() {
    const pocketDetector = new PocketDetector();

    return (
        <React.Fragment>
            <span>Pocket Detection</span>
            <Model isEntityPartOfPocket={pocketDetector.isEntityPartOfPocket} />
            <span>Pocket Count: {pocketDetector.getPocketCount()}</span>
        </React.Fragment>
    );
}

ReactDOM.render(
    <App />,
    document.getElementById('root')
);
