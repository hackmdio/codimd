export const uiElemsWithoutJquery = () => ({
    toolbar: {
        edit: document.querySelector('.ui-edit'),
        both: document.querySelector('.ui-both')
    },
    infobar: {
        permission: {
            permission: document.querySelector('.ui-permission'),
            label: document.querySelector('.ui-permission-label'),
            freely: document.querySelector('.ui-permission-freely'),
            editable: document.querySelector('.ui-permission-editable'),
            locked: document.querySelector('.ui-permission-locked'),
            private: document.querySelector('.ui-permission-private'),
            limited: document.querySelector('.ui-permission-limited'),
            protected: document.querySelector('.ui-permission-protected')
        }
    }
})

export default uiElemsWithoutJquery