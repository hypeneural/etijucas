/**
 * UI-only enums that don't come from the API
 */
/** Loading states for async operations */
export var LoadingState;
(function (LoadingState) {
    LoadingState["Idle"] = "idle";
    LoadingState["Loading"] = "loading";
    LoadingState["Success"] = "success";
    LoadingState["Error"] = "error";
})(LoadingState || (LoadingState = {}));
/** Form submission states */
export var FormState;
(function (FormState) {
    FormState["Initial"] = "initial";
    FormState["Submitting"] = "submitting";
    FormState["Submitted"] = "submitted";
    FormState["Error"] = "error";
})(FormState || (FormState = {}));
/** Modal sizes */
export var ModalSize;
(function (ModalSize) {
    ModalSize["Small"] = "sm";
    ModalSize["Medium"] = "md";
    ModalSize["Large"] = "lg";
    ModalSize["FullScreen"] = "full";
})(ModalSize || (ModalSize = {}));
