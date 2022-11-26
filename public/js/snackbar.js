/** snackbar.js
 * Has all the snackbar class code in it
 * To use the snackbar, just give it some text, give it some options (or not) and .show() it.
 * It goes a little more into detail in the descriptions of each function. It also has a nice
 * little jsdoc thing if you're using something that supports it. If not, sucks for you.
 */
class Snackbar {

    /**
     * snackbars contains key value pairs of snackbar IDs and snackbar references respectively
     *  if you ever need to get a snackbar from an ID
     * snackbarIDs makes sure the IDs are unique
     */
    static snackbars = {};
    static snackbarIDs = new Set();

    /**
     * state IDs
     * DESTROYED means it doesn't exist in html
     * HIDDEN means it exists but is hidden
     * SHOWN means it exists and is shown
     */
    static DESTROYED = 0
    static HIDDEN = 1
    static SHOWN = 2

    /**
     * @constructor
     * @param {string} text - Text is the main requirement, and it's just text
     * @param {Object} options
     * @param {string} [options.color="green"] - reference to a color or a variable, sets the background color
     * @param {string} options.textColor - reference to a color or a variable, sets the text color
     * @param {string} options.buttonText - Sets the button text, both it and buttonClick have to be defined for the button to show
     * @param {buttonCallback} options.buttonClick - Sets the button's onclick logic, both it and buttonText have to be defined for the button to show
     * @param {boolean} [options.destroyWhenButtonClicked=true] - Whether or not it should destroy itself when the button is clicked, defaults to true
     * @param {bodyCallback} options.bodyClick - Sets the body's onclick logic
     * @param {boolean} [options.destroyWhenBodyClicked=true] - Whether or not it should destroy itself when the body is clicked, defaults to true
     * @param {number} options.timeout - Time in ms
     * @param {timeoutCallback} options.timeoutFunction - What to run on timeout (doesn't run if hidden or destroyed)
     * @param {string} options.timeoutMode - can be "destroy", "hide", "none" or empty. Determines what to do on timeout, destroys by default
     */
    constructor(text, options = {destroyWhenButtonClicked: true, destroyWhenBodyClicked: true, timeoutFunction: () => {}, timeoutEndFunction: "destroy" }) {
        this.text = text;
        Object.assign(this, options);

        switch (options.timeoutMode) {
            case "hide":
                this.timeoutEndFunction = () => this.hide();
                break;
            case "none":
                this.timeoutEndFunction = () => {};
                break;
            case "destroy":
            default:
                this.timeoutEndFunction = () => this.destroy();
                break;
        }

        //sets state to destroyed
        this.state = Snackbar.DESTROYED
        this.id = this.createID();
    }

    /**
     * creates the snackbar in the HTML
     * if you want to show it as soon as you make it, use show without calling make instead
     * returns the snackbar object
     */
    make() {

        //creates the snackbar and gives it classes
        const snackbarNode = document.createElement("DIV");
        snackbarNode.classList.add("snackbar");
        snackbarNode.classList.add("hidden");

        //assigns its id based off of it's actual id
        snackbarNode.id = `snackbar-${this.id}`;

        //adds color if given
        if (this.color)
            snackbarNode.style.backgroundColor = this.color;

        // sets the body onclick listener which just destroys it by default
        const bodyOnClickFunction = this.bodyClick !== undefined ? () => this.bodyClick() : () => {};
        const destroyFromBody = this.destroyWhenBodyClicked ? () => this.destroy() : () => {};
        snackbarNode.addEventListener("click", () => {
            bodyOnClickFunction();
            destroyFromBody();
        })

        //adds the text
        const textNode = document.createElement("SPAN");
        textNode.textContent = this.text;

        //colors the text if necessary
        if (this.textColor)
            textNode.style.color = this.textColor;

        //adds the text node
        snackbarNode.appendChild(textNode);

        //makes the button if given button parameters
        if (this.buttonText  && this.buttonClick) {
            //creates the button and adds class
            const buttonNode = document.createElement("BUTTON");

            //creates the text span
            const buttonTextNode = document.createElement("SPAN");
            buttonTextNode.textContent = this.buttonText;

            //colors the text if necessary
            if (this.textColor)
                buttonTextNode.style.color = this.textColor;

            if (this.color)
                buttonNode.style.backgroundColor = this.color;

            // adds the text node
            buttonNode.appendChild(buttonTextNode);

            // sets the button onclick listener which runs the given funtion and destroys the snackar by default
            const destroyFromButton = this.destroyWhenButtonClicked ? () => this.destroy() : () => {};
            buttonNode.addEventListener("click", event => {
                this.buttonClick();
                destroyFromButton();
                this.destroy();
                //stops propogation so the body event isn't called
                event.stopPropagation();
            })

            snackbarNode.appendChild(buttonNode);
        }

        //adds the node to the body, puts reference to DOM element in this.element
        document.body.appendChild(snackbarNode);
        this.element = document.getElementById(`snackbar-${this.id}`);

        this.state = Snackbar.HIDDEN
        return this;
    }

    /**
     * shows the snackbar
     * if it's not already made, makes it
     * if you need to show right after making, use this
     * returns the snackbar object
     */
    show() {
        //starts the timeout
        if (this.timeout !== undefined) {
            this.timeoutInProgress = setTimeout(() => {
                this.timeoutFunction();
                this.timeoutEndFunction();
                this.timeoutInProgress = undefined; //resets the timeoutInProgress variable at the end of the timeout
            }, this.timeout);
        }

        const removeHidden = () => {
            this.state = Snackbar.SHOWN
            this.element.classList.remove("hidden");
        }

        //if not already made, makes the snackbar
        if (document.getElementById(`snackbar-${this.id}`) === null) {
            this.make();
            //waits a momement to make sure the snackbar's animation functions properly
            setTimeout(removeHidden, 10);
            return this;
        } else {
            removeHidden();
            return this;
        }
    }

    /**
     * hides the snackbar
     * returns the snackbar object
     */
    hide() {
        if (this.timeoutInProgress !== undefined) {
            clearTimeout(this.timeoutInProgress);
            this.timeoutInProgress = undefined;
        }

        this.element.classList.add("hidden");
        this.state = Snackbar.HIDDEN
        return this;
    }

    /**
     * destroys the snackbar, its references and its ID
     * if it's not already hidden, hides it unless override is true
     */
    destroy() {
        const snackbar = this;

        //function which deletes the references and ids
        const finalizeDeletion = function() {
            snackbar.element.remove();
            delete Snackbar.snackbarIDs[Snackbar.snackbarIDs.indexOf(snackbar.id)];
            delete Snackbar.snackbars[snackbar.id];
            snackbar.id = undefined;
        }

        this.state = Snackbar.DESTROYED

        //if it's not hidden it shouldn't just dissapear
        if (this.element.classList.contains("hidden")) {
            finalizeDeletion();
        } else {
            this.hide();
            //deletes it as soon as it's actually hidden
            setTimeout(finalizeDeletion, 250);
        }
    }

    /**
     * creates and reserves the ID for this snackbar
     * also creates its reference in snackbars
     * @returns {number} new id
     */
    createID() {
        let id = 0;
        // goes through all consecutive numbers to find an id
        for (; id in Snackbar.snackbarIDs; id++); // checks if the id already exists, otherwise continues to iterate

        Snackbar.snackbarIDs.add(id);
        Snackbar.snackbars[id] = this;

        return id;
    }
}
