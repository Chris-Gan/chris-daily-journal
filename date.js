exports.currentDate = function(){
    const today = new Date();
    const options = {day:"numeric",month:"long",weekday:"short",year:"numeric"};
    return today.toLocaleDateString("en-US",options);

}