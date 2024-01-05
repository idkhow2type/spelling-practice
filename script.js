const startBtn = document.querySelector('.title>button');
const title = document.querySelector('.title');

const voicesSelect = document.querySelector('form[name="voice"]');

const wordInputForm = document.querySelector('form[name="word"]');
const wordInput = document.querySelector('input[name="word-input"]');
const replayBtn = document.querySelector('button[name="replay"]');

const stats = document.querySelector('.stats');
const totalStats = document.querySelector('.total-stats');

let words = (await (await fetch('words.txt')).text())
    .split('\n')
    .map((word) => word.trim());
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
        console.log(words,currWord)

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