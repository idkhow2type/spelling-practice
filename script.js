const startBtn = document.querySelector('.title>button');
const title = document.querySelector('.title');

const voicesSelect = document.querySelector('form[name="voice"]');

const listUrl = document.querySelector('input[name="list-url"]');
const listText = document.querySelector('textarea[name="list-text"]');
const listFile = document.querySelector('input[name="list-file"]');
const listDefault = document.querySelector('button[name="list-default"]');

const wordInputForm = document.querySelector('form[name="word"]');
const wordInput = document.querySelector('input[name="word-input"]');
const replayBtn = document.querySelector('button[name="replay"]');

const stats = document.querySelector('.stats');
const totalStats = document.querySelector('.total-stats');

let words;
let currWord = 0;
let totalWords = 0;
let totalCorrect = 0;

function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

function reset() {
    title.classList.remove('hide');
    wordInputForm.classList.add('hide');
    stats.classList.add('hide');
    document.body.classList.remove('wrong', 'correct');
}

function loadWordList(string) {
    listText.value = string;
    words = string
        .split('\n')
        .filter((word) => word)
        .map((word) => word.trim());
    localStorage.setItem('words', string);
    reset();
}

loadWordList(
    localStorage.getItem('words') ||
        (await (await fetch('default-words.txt')).text())
);

listUrl.onchange = async () => {
    try {
        const res = await fetch(listUrl.value, {
            headers: {
                'Content-type': 'text/plain',
            },
        });
        if (!res.headers.get('content-type')?.includes('text'))
            alert('Warning: This file may not be a text file');
        loadWordList(await res.text());
    } catch (error) {
        alert('Connection error');
    }
};

listText.onchange = () => {
    loadWordList(listText.value);
};

listFile.onchange = (e) => {
    e.preventDefault();
    // check if file is .txt
    // if it is not, alert user and return
    // else read file, write to listText.value, words and localStorage
    const file = listFile.files[0];
    if (!file.name.endsWith('.txt')) {
        alert('File must be a .txt file');
        return;
    }
    const reader = new FileReader();
    reader.readAsText(file);
    reader.onload = () => {
        loadWordList(reader.result);
    };
};

listDefault.onclick = async () => {
    loadWordList(await (await fetch('default-words.txt')).text());
};

speechSynthesis.onvoiceschanged = () => {
    function getUtterence(string) {
        const utterance = new SpeechSynthesisUtterance(string);
        utterance.voice = speechSynthesis
            .getVoices()
            .find((voice) => voice.name === localStorage.getItem('voice'));
        return utterance;
    }

    speechSynthesis
        .getVoices()
        .filter((voice) => voice.lang.startsWith('en'))
        .forEach((voice, i) => {
            const radio = document.createElement('input');
            radio.type = 'radio';
            radio.name = 'voice';
            radio.value = voice.name;
            radio.id = voice.name;

            const label = document.createElement('label');
            label.textContent = voice.name;
            label.htmlFor = voice.name;

            radio.checked = localStorage.getItem('voice') === voice.name || !i;
            if (radio.checked) localStorage.setItem('voice', voice.name);
            radio.onchange = () => localStorage.setItem('voice', voice.name);

            voicesSelect.append(radio, label);
        });

    replayBtn.addEventListener('click', () => {
        speechSynthesis.cancel();
        speechSynthesis.speak(getUtterence(words[currWord]));
        wordInput.focus();
    });

    startBtn.addEventListener('click', () => {
        title.classList.add('hide');
        wordInputForm.classList.remove('hide');
        newWord();
    });

    function newWord(e) {
        if (e) e.preventDefault();

        stats.classList.add('hide');
        document.body.classList.remove('wrong', 'correct');

        if (currWord === 0) words = shuffle(words);

        wordInput.value = '';
        wordInput.focus();
        speechSynthesis.cancel();
        speechSynthesis.speak(getUtterence(words[currWord]));
        const startTime = Date.now();

        wordInputForm.onsubmit = (e) => {
            e.preventDefault();

            const answer = {
                word: words[currWord],
                input: wordInput.value,
                time: Date.now() - startTime,
            };

            wordInput.value = '';

            stats.querySelector('.answer-input').innerText = answer.input;
            stats.querySelector('.correct-answer').innerText = answer.word;
            stats.querySelector('.time').innerText = answer.time / 1000 + 's';
            stats.classList.remove('hide');

            document.body.classList.add(
                answer.word === answer.input ? 'correct' : 'wrong'
            );

            const statItem = [
                document.createElement('p'),
                document.createElement('p'),
                document.createElement('p'),
                document.createElement('p'),
            ];
            statItem[0].innerText = answer.input;
            statItem[1].innerText = answer.word;
            statItem[2].innerText = answer.input === answer.word ? '✓' : '✗';
            statItem[3].innerText = answer.time / 1000 + 's';

            const statItems = totalStats.querySelector('.stat-items');
            statItems.append(...statItem);
            statItems.scrollTop = statItems.scrollHeight;

            totalWords++;
            totalCorrect += answer.input === answer.word;

            totalStats.querySelector(
                '.word-count'
            ).innerText = `Total words: ${totalWords}`;
            totalStats.querySelector(
                '.percentage'
            ).innerText = `Correct percentage: ${(
                (totalCorrect / totalWords) *
                100
            ).toFixed(2)}%`;

            currWord = (currWord + 1) % words.length;
            wordInputForm.onsubmit = newWord;
        };
    }
};
