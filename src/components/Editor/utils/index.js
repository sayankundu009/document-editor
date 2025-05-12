export function setClass(element, ...classNames) {
    classNames.forEach(className => {
        element.classList.add(className);
    });
}

export function removeClass(element, ...classNames) {
    classNames.forEach(className => {
        element.classList.remove(className);
    });
}


