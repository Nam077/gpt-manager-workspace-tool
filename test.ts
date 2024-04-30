import { log } from 'console';
class Student {
    constructor(
        private name: string,
        private age: number,
    ) {
        log(`Student created: ${name}, ${age}`);
    }

    get getName() {
        return this.name;
    }

    set setName(name: string) {
        this.name = name;
    }

    get getAge() {
        return this.age;
    }

    set setAge(age: number) {
        this.age = age;
    }
}
