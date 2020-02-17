import Snake from "./snake";

const snake = new Snake();

const settings = {};

const setSettings = () => {

    settings.fieldWidth = document.getElementsByClassName("debug-width")[0].value;
    settings.fieldHeight = document.getElementsByClassName("debug-height")[0].value;
    settings.length = document.getElementsByClassName("debug-length")[0].value;
    settings.speed = document.getElementsByClassName("debug-speed")[0].value;
    settings.speedMultiplicator = document.getElementsByClassName("debug-multiplicator")[0].value;
    settings.sectionSize =document.getElementsByClassName("debug-section")[0].value;
};

setSettings();

snake.init(settings);

document.getElementsByClassName("reset-game")[0].addEventListener("click", () => {
    setSettings();
    snake.init(settings);
});