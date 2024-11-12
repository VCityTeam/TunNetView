/** This file is meant to be used with the udvizBrowser bundle => udvizBrowser have to be a global */

/**
 *
 * Add a loading screen which add itself to document.body then remove it self when view layer initialize event it fires
 *
 * @param {Array<string>} labels - array of label to display
 */
const loadingScreen = function (labels, promise) {
  return new Promise((resolve) => {
    const root = document.createElement('div');
    root.classList.add('loading_screen');
    document.body.appendChild(root);

    const characterContainer = document.createElement('div');
    characterContainer.classList.add('loading_screen_character_container');
    root.appendChild(characterContainer);

    const characterArray = [];
    const spaceTag = 'space_tag';
    labels.forEach((label) => {
      characterArray.push(...label.split(''));
      characterArray.push(spaceTag); // <== add space between label
    });

    const offsetAnimation = 0.05;
    characterArray.forEach((character, index) => {
      const el = document.createElement('div');
      el.classList.add('loading_screen_character');
      if (character == spaceTag) {
        el.style.width = '30px';
      } else {
        el.innerText = character;
      }
      el.style.animationDelay = offsetAnimation * index + 's';
      characterContainer.appendChild(el);
    });

    const removeLoadingScreen = () => {
      if (root.parentElement) {
        root.style.opacity = 0;
        root.addEventListener('transitionend', () => root.remove());
      }
    };

    promise.then(() => {
      removeLoadingScreen();
      resolve();
    });
  });
};
