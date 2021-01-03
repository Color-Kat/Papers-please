export function rand(min: number, max: number) {
    let rand = min + Math.random() * (max + 1 - min);
    return Math.floor(rand);
}
export function randStr(){
    let random = rand(1, arguments.length-1);
    return arguments[random];
}