
function transferAllNotes (note, fromUserId, toUserId) {
    console.log('changing');
    console.log(fromUserId);
    console.log(toUserId);
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
