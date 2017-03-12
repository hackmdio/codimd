
function transferAllNotes (note, fromUserId, toUserId) {
    return note.update({
        ownerId: toUserId
    }, {
        where: {
            ownerId: fromUserId
        }
    });
}

module.exports = {
    transferAllNotes: transferAllNotes,
};
