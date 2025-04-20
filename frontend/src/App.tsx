import {useEffect, useState} from 'react'
import './App.css'
import JigsawPuzzle from "./components/JigsawPuzzle.tsx";
import ScrollableSelector from "./components/ScrollableSelector.tsx";
import CountdownTimer from "./components/CountdownTimer.tsx";

// Images
import three from './assets/penticton_illustration_resized.png'
import two from './assets/penticton_animals_resized.png'
import one from './assets/okanagan_ogopogo_resized.png'
import cat from './assets/cat_champion_resized.png'
import win from './assets/winner_w_cloud_resized.png'
import winners from './assets/winners.png'
import gameOver from './assets/gameOver.png'
import {PASSWORD} from "./constants.ts";


const ALBUM = {
    [0]: {
        image: three,
        hint: 'Three Candies',
        isCompleted: false,
        rows:3,
        cols:4
    },
    [1]: {
        image: two,
        hint: 'One if you',
        isCompleted: false,
        rows:3,
        cols:4
    },
    [2]: {
        image: one,
        hint: 'read backwards but count as is',
        isCompleted: false,
        rows:3,
        cols:4
    },
    [3]: {
        image: cat,
        hint: 'you Will get',
        isCompleted: false,
        rows:3,
        cols:4
    },
    [4]: {
        image: win,
        hint: 'Two Clowns Win',
        isCompleted: false,
        rows:3,
        cols:4
    }
}

function App() {
const [code, setCode] = useState(['0', '0', '0', 'A', 'B']);
const [currentImage, setCurrentImage] = useState(0);
const [showLastHint, setShowLastHint] = useState(false);
const [startQuest, setStartQuest] = useState(false);
const [gameIsOver, setGameIsOver] = useState(false);
const [win, setWin] = useState(false);

useEffect(() => {
 if (currentImage === Object.entries(ALBUM).length) {
     setShowLastHint(true)
 }
}, [currentImage])
    const submitCode = () => {
    console.log(code)
        if (code.join('') === PASSWORD) {
            setWin(true)
        } else {
            setGameIsOver(true)
        }
    }
    const handleTimerStart = () => {
    setStartQuest(true)
    }
    const handleTimerComplete = () => {
    setGameIsOver(true)
    }

console.log(currentImage)
    console.log(ALBUM)
    if (gameIsOver) {
        return <div><img src={gameOver} alt={'game over'}/></div>
    }

    if (win) {
        return <img src={winners} alt={'winners'} />
    }
  return (
    <>
        <div className={'timer'}> <CountdownTimer onStart={handleTimerStart} onComplete={handleTimerComplete}/></div>
        {!startQuest && (
            <div className={'intro'}>
                Complete all puzzles, note hint words, in the end be careful, read the major hint, type the CODE and submit only <b>ONCE</b>
            </div>

        )}
        {showLastHint && <div className={'code'}> You entered: <strong>{code.join('')}</strong> <button onClick={submitCode}>SUBMIT</button></div>}
        {showLastHint && <h1>Last Hint: <i>Two Clowns Win Three Candies you Will get One <br /> if you read backwards but count as is</i></h1>}
        {showLastHint && <div style={{ display: 'flex', flexDirection: 'row' }}>
        <ScrollableSelector
            options={Array.from('0123456789')}
            onSelect={(selected) => setCode(c => {
                const old = [...c]
                old[0] = selected
                return old;
            })}
            initialSelected={code[0]}
        /><ScrollableSelector
            options={Array.from('0123456789')}
            onSelect={(selected) => setCode(c => {
                const old = [...c]
                old[1] = selected
                return old;
            })}
            initialSelected={code[1]}
        /><ScrollableSelector
            options={Array.from('0123456789')}
            onSelect={(selected) => setCode(c => {
                const old = [...c]
                old[2] = selected
                return old;
            })}
            initialSelected={code[2]}
        /><ScrollableSelector
            options={Array.from('ABCFVGTWYZ')}
            onSelect={(selected) => setCode(c => {
                const old = [...c]
                old[3] = selected
                return old;
            })}
            initialSelected={code[3]}
        /><ScrollableSelector
            options={Array.from('ABCFVGTWYZ')}
            onSelect={(selected) => setCode(c => {
                const old = [...c]
                old[4] = selected
                return old;
            })}
            initialSelected={code[4]}
        /></div>}
        {!showLastHint && startQuest && <JigsawPuzzle
              imagePath={ALBUM[currentImage as keyof typeof ALBUM]?.image}
              rows={ALBUM[currentImage as keyof typeof ALBUM]?.rows}
              cols={ALBUM[currentImage as keyof typeof ALBUM]?.cols}
              hintWord={ALBUM[currentImage as keyof typeof ALBUM]?.hint}
              onComplete={() => {
                  ALBUM[currentImage as keyof typeof ALBUM].isCompleted = true;
                  setCurrentImage(s => Number(s) + 1)
              }}
          />}
    </>
  )
}

export default App
