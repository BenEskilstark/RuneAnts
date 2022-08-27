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
const {useRune} = require('../selectors/misc');
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
  const [loading, setLoading] = useState('Loading..');
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
    if (loading == 'Loading..') {
      setLoading('Loading...');
      setTimeout(() => playLevel(store, level, setLoadingProgress, setIsLoaded), 100);
    }
    if (loading != '') {
      let progress = 0;
      const state = store.getState();
      if (state.game != null) {
        progress = state.game.loadingProgress;
      }
      if (isLoaded) {
        dispatch({type: 'SET_SCREEN', screen: 'GAME'});

        const Rune = useRune();
        if (Rune && !store.getState().runeInited) {
          Rune.init({
            resumeGame: () => dispatch({type: 'START_TICK'}),
            pauseGame: () => dispatch({type: 'STOP_TICK'}),
            restartGame: () => {
              dispatch({type: 'STOP_TICK'});
              dispatch({type: 'RETURN_TO_LOBBY'});
            },
            getScore: () => {
              const game = store.getState().game;
              if (game) return game.score;
              return 0;
            }
          });
        } else {
          dispatch({type: 'START_TICK'});
        }
      }
    }
  }, [loading, isLoaded, loadingProgress]);

  return (
    <span></span>
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
    if (
      progress < 100 ||
      Object.keys(state.sprites).length < Object.keys(globalConfig.config.imageFiles).length
    ) {
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
