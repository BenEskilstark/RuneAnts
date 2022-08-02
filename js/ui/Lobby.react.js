// @flow

const React = require('react');
const axios = require('axios');
const AudioWidget = require('./components/AudioWidget.react');
const Button = require('./components/Button.react');
const Checkbox = require('./components/Checkbox.react');
const Dropdown = require('./components/Dropdown.react');
const Divider = require('./components/Divider.react');
const Modal = require('../ui/components/Modal.react');
const QuitButton = require('../ui/components/QuitButton.react');
const levels = require('../levels/levels');
const {loadLevel} = require('../thunks/levelThunks');
const {initSpriteSheetSystem} = require('../systems/spriteSheetSystem');
const {isMobile} = require('../utils/helpers');
const globalConfig = require('../config');
const {useState, useEffect, useMemo} = React;

import type {State, Action} from '../types';

type Props = {
  store: Store,
  dispatch: (action: Action) => Action,
};

function Lobby(props: Props): React.Node {
  const {dispatch, store} = props;
  const state = store.getState();

  const [level, setLevel] = useState('smallerLevel');
  const [loading, setLoading] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [difficulty, setDifficulty] = useState('NORMAL');

  // handle screen size change specifically for background gif
  const [rerender, setRerender] = useState(0);
  const onresize = () => setRerender(rerender + 1);
  let width = window.innerWidth;
  let height = window.innerHeight;
  useEffect(() => {
    window.addEventListener('resize', onresize);
    width = window.innerWidth;
    height = window.innerHeight;
    return (() => {
      window.removeEventListener('resize', onresize);
    });
  }, [rerender]);

  // on mount
  useEffect(() => {
    initSpriteSheetSystem(store);
    // axios
    //   .post('/visit', {
    //     hostname: window.location.hostname, path: '/index', isUnique: !isRevisit, map: 'lobby',
    //   })
    //   .then(() => {
    //     localStorage.setItem('isRevisit', true);
    //   });
  }, []);

  // on start click
  useEffect(() => {
    if (loading != '') {
      let progress = 0;
      const state = store.getState();
      if (state.game != null) {
        progress = state.game.loadingProgress;
      }
      let title = 'perimeter'
      let body = 'Keep your underground base alive as long as you can while missiles ' +
        'rain down from the sky! Combine the resources around you in novel ways to create '+
        'the alloys used to build anti-missile turrets and generate the electricity to ' +
        ' power them. Can you create an impenetrable perimeter?';
      if (isMobile()) {
        title = '~~Experimental~~ Mobile Mode';
        body = 'Sorry, the game is not yet ready to play on mobile devices :( ' +
          'try going to this link on a computer instead';
      }
      dispatch({type: 'SET_MODAL', modal: (
        <Modal
          title={title}
          body={body}
          buttons={[{
            label: !isLoaded ? `(Loading... ${progress.toFixed(1)}%)` : 'Begin',
            disabled: !isLoaded,
            onClick: () => {
              if (isLoaded) {
                // const isUnique = !!!localStorage.getItem('revisit_' + level);
                // axios
                //   .post('/visit', {
                //     hostname: window.location.hostname, path: '/game', map: level, isUnique,
                //   })
                //   .then(() => {
                //     localStorage.setItem('revisit_' + level, true);
                //   });
                dispatch({type: 'DISMISS_MODAL'});
                dispatch({type: 'SET_SCREEN', screen: 'GAME'});
                dispatch({type: 'START_TICK'});
                dispatch({type: 'SET_DIFFICULTY', difficulty});
                if (difficulty == 'EASY') {
                  dispatch({type: 'PAUSE_MISSILES', pauseMissiles: true});
                }
              }
            }
          }]}
        />
      )});
    }
    if (loading == 'Loading..') {
      setLoading('Loading...');
      setTimeout(() => playLevel(store, level, setLoadingProgress, setIsLoaded), 100);
    }
  }, [loading, isLoaded, loadingProgress]);

  return (
    <span>
      <QuitButton isInGame={false} dispatch={dispatch} />
      <div
        style={{
          margin: 'auto',
          maxWidth: 700,
          padding: 8,
          textAlign: 'center',
          fontFamily: '"Courier New", sans-serif',
        }}
      >
        <div
          style={{
            width: '100%',
            height: '100%',
            position: 'absolute',
            top: 0,
            left: 0,
            display: 'inline',
            zIndex: -1,
            opacity: 0.3,
          }}
        >
          <img
            width={width}
            height={height}
            src={'img/perimeterBackground1.gif'}
          />
        </div>
        <h1>perimeter</h1>
        <h3>~Beta~</h3>
        <h2 style={{fontSize: '4em', marginBottom: 0}}>Play:</h2>
        <Button
          style={{
            width: '100%',
            height: 50,
            fontSize: '2em',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          disabled={loading != '' || isLoaded}
          label="Easy"
          onClick={() => {
            setDifficulty('EASY');
            setLoading("Loading..");
          }}
        />
        <div style={{marginBottom: 12}}>
          Missiles don't start coming at you until you're ready
        </div>
        <Button
          style={{
            width: '100%',
            height: 50,
            fontSize: '2em',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          disabled={loading != '' || isLoaded}
          label="Normal"
          onClick={() => {
            setDifficulty('NORMAL');
            setLoading("Loading..");
          }}
        />
        <div style={{marginBottom: 12}}>
          Missiles come at you in waves of increasing difficulty
        </div>
        <Button
          style={{
            width: '100%',
            height: 50,
            fontSize: '2em',
            borderRadius: '8px',
            cursor: 'pointer',
          }}
          disabled={loading != '' || isLoaded}
          label="Hard"
          onClick={() => {
            setDifficulty('HARD');
            setLoading("Loading..");
          }}
        />
        <div style={{marginBottom: 12}}>
          Missiles come at you relentlessly from the start
        </div>
        <h3>{loading}</h3>
      </div>
      <LevelEditor dispatch={dispatch} />
      <MadeBy />
    </span>
  );
}

function MadeBy(props) {
  const [rerender, setRerender] = useState(0);

  const onresize = () => setRerender(rerender + 1);

  let left = window.innerWidth - 315;
  let top = window.innerHeight - 82;
  useEffect(() => {
    window.addEventListener('resize', onresize);
    left = window.innerWidth - 315;
    top = window.innerHeight - 82;
    return (() => {
      window.removeEventListener('resize', onresize);
    });
  }, [rerender]);

  return (
    <div
      style={{
        position: 'absolute',
        left,
        top,
        padding: 6,
        fontSize: '1.4em',
        backgroundColor: 'rgba(250, 248, 239, 0.5)',
      }}
    >
      <div>
        Made by&nbsp;
        <b>
          <a
            id="benhub"
            style={{
              textDecoration: 'none',
            }}
            href="https://www.benhub.io" target="_blank">Ben Eskildsen
          </a>
        </b>
      </div>
    </div>
  );
}

function LevelEditor(props) {
  const {dispatch} = props;
  const [level, setLevel] = useState('smallerLevel');
  const [useLevel, setUseLevel] = useState(true);
  const [rerender, setRerender] = useState(0);

  const onresize = () => setRerender(rerender + 1);

  let left = 5;
  let top = window.innerHeight - 82;
  useEffect(() => {
    window.addEventListener('resize', onresize);
    left = 5;
    top = window.innerHeight - 82;
    return (() => {
      window.removeEventListener('resize', onresize);
    });
  }, [rerender]);

  return (
    <div
      style={{
        position: 'absolute',
        width: 310,
        left,
        top,
        backgroundColor: 'rgb(250, 248, 239)',
        borderRadius: 8,
        padding: 4,
      }}
    >
      Select Level:
      <Dropdown
        options={Object.keys(levels)}
        selected={level}
        onChange={setLevel}
      />
      <div>
        <Checkbox
          label="Use Selected Level"
          checked={useLevel}
          onChange={setUseLevel}
        />
      </div>
      <div>
        <Button
          label="Level Editor"
          style={{
            width: '100%',
          }}
          onClick={() => {
            dispatch({type: 'START', screen: 'EDITOR', isExperimental: true});
            if (useLevel) {
              dispatch({type: 'SET_LEVEL', level: levels[level], isExperimental: true});
              dispatch({type: 'SET_PLAYERS_AND_SIZE'});
            }
          }}
        />
      </div>
    </div>
  );
}

function playLevel(store, levelName: string, setLoadingProgress, setIsLoaded): void {
  const dispatch = store.dispatch;
  const state = store.getState();

  dispatch({type: 'START', screen: 'LOBBY'});
  loadLevel(store, levelName, []);

  const checkLoading = () => {
    const state = store.getState();
    let progress = 0;
    if (state.game != null) {
      progress = state.game.loadingProgress;
      setLoadingProgress(progress);
    }
    if (progress < 100) {
      setTimeout(checkLoading, 100);
    } else {
      setIsLoaded(true);
    }
  }
  setTimeout(checkLoading, 100);
  // setIsLoaded(true);

  // dispatch({type: 'START_TICK'});
}

module.exports = Lobby;
