import {expect} from 'chai';
import {describe, it, beforeEach, afterEach} from 'mocha';
import {Game} from '../src/game';

let logs: string[];
let originalLog: (...args: any[]) => void;

beforeEach(function() {
    logs = [];
    originalLog = console.log;
    console.log = function(msg?: any) {
        logs.push(String(msg));
    };
});

afterEach(function() {
    console.log = originalLog;
});

function logsContaining(substr: string): string[] {
    return logs.filter(function(line) {
        return line.indexOf(substr) !== -1;
    });
}

describe('Game', function() {

    describe('add', function() {
        it('returns true and announces the player as number 1 for the first player', function() {
            const game = new Game();
            const result = game.add('Alice');

            expect(result).to.equal(true);
            expect(logs).to.include('Alice was added');
            expect(logs).to.include('They are player number 1');
        });

        it('numbers players in the order they were added', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');

            expect(logs).to.include('They are player number 2');
        });
    });

    describe('roll - movement', function() {
        it('moves the first player added from space 0 (regression: used to compute NaN)', function() {
            const game = new Game();
            game.add('Alice');

            game.roll(3);

            expect(logsContaining('NaN')).to.have.lengthOf(0);
            expect(logs).to.include("Alice's new location is 3");
        });

        it('wraps around the 12-space board instead of growing unbounded', function() {
            const game = new Game();
            game.add('Alice');

            game.roll(11);
            logs = [];
            game.roll(3); // 11 + 3 = 14, should wrap to 2, not 14

            expect(logs).to.include("Alice's new location is 2");
        });

        it('tracks each player\'s position independently', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');

            game.roll(5); // Alice: 0 -> 5
            game.wasCorrectlyAnswered(); // turn -> Bob
            logs = [];
            game.roll(2); // Bob: 0 -> 2

            expect(logs).to.include("Bob's new location is 2");
        });
    });

    describe('category mapping', function() {
        const cases: Array<[number, string, string]> = [
            [4, 'Pop', 'Pop Question 0'],
            [1, 'Science', 'Science Question 0'],
            [2, 'Sports', 'Sports Question 0'],
            [3, 'Rock', 'Rock Question 0'],
        ];

        cases.forEach(function(testCase) {
            const roll = testCase[0];
            const category = testCase[1];
            const firstQuestion = testCase[2];

            it('asks a ' + category + ' question when landing on space ' + roll, function() {
                const game = new Game();
                game.add('Alice');

                game.roll(roll);

                expect(logs).to.include('The category is ' + category);
                expect(logs).to.include(firstQuestion);
            });
        });

        it('draws questions from the pool in order, without repeats', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');

            game.roll(1); // Alice -> Science, "Science Question 0"
            game.wasCorrectlyAnswered(); // turn -> Bob
            game.roll(1); // Bob -> Science, "Science Question 1"

            expect(logs).to.include('Science Question 0');
            expect(logs).to.include('Science Question 1');
        });
    });

    describe('wrongAnswer', function() {
        it('sends the current player to the penalty box and always returns true', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');
            game.roll(2);

            const result = game.wrongAnswer();

            expect(result).to.equal(true);
            expect(logs).to.include('Alice was sent to the penalty box');
        });

        it('advances the turn to the next player, wrapping after the last player', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');
            game.roll(1);
            game.wrongAnswer(); // Alice -> penalty box, turn -> Bob
            game.wrongAnswer(); // Bob -> penalty box, turn wraps back -> Alice
            logs = [];

            game.roll(1);

            expect(logs).to.include('Alice is the current player');
        });
    });

    describe('penalty box behaviour', function() {
        function sendCurrentPlayerToPenaltyBox(game: Game): void {
            game.roll(1);
            game.wrongAnswer();
        }

        it('keeps a player in the penalty box on an even roll, without moving them', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');
            sendCurrentPlayerToPenaltyBox(game); // Alice -> penalty, turn -> Bob
            sendCurrentPlayerToPenaltyBox(game); // Bob -> penalty, turn -> Alice
            logs = [];

            game.roll(4); // even roll while Alice is in the penalty box

            expect(logs).to.include('Alice is not getting out of the penalty box');
            expect(logsContaining("'s new location is")).to.have.lengthOf(0);
        });

        it('releases a player from the penalty box on an odd roll and moves them', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');
            sendCurrentPlayerToPenaltyBox(game); // Alice -> penalty, turn -> Bob
            game.roll(1);
            game.wasCorrectlyAnswered(); // Bob answers correctly, turn -> Alice
            logs = [];

            game.roll(3); // odd roll while Alice is in the penalty box

            expect(logs).to.include('Alice is getting out of the penalty box');
            expect(logsContaining("Alice's new location is")).to.have.lengthOf(1);
        });

        it('does not award a gold coin while a player is stuck in the penalty box', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');
            sendCurrentPlayerToPenaltyBox(game); // Alice -> penalty, turn -> Bob
            game.roll(1);
            game.wasCorrectlyAnswered(); // Bob answers correctly, turn -> Alice
            game.roll(2); // even roll, Alice stays in the penalty box
            logs = [];

            const result = game.wasCorrectlyAnswered();

            expect(result).to.equal(true); // game continues
            expect(logsContaining('Gold Coins')).to.have.lengthOf(0);
        });

        it('awards a gold coin the turn a player gets out of the penalty box', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');
            sendCurrentPlayerToPenaltyBox(game); // Alice -> penalty, turn -> Bob
            game.roll(1);
            game.wasCorrectlyAnswered(); // Bob answers correctly, turn -> Alice
            game.roll(3); // odd roll, Alice gets out of the penalty box
            logs = [];

            const result = game.wasCorrectlyAnswered();

            expect(result).to.equal(true);
            expect(logs).to.include('Alice now has 1 Gold Coins.');
        });
    });

    describe('wasCorrectlyAnswered - winning', function() {
        it('awards a gold coin and reports the game should continue below the winning threshold', function() {
            const game = new Game();
            game.add('Alice');
            game.roll(2);

            const result = game.wasCorrectlyAnswered();

            expect(result).to.equal(true);
            expect(logs).to.include('Alice now has 1 Gold Coins.');
        });

        it('reports the game is over once a player reaches 6 gold coins', function() {
            const game = new Game();
            game.add('Alice');

            let result = true;
            for (let i = 0; i < 6; i++) {
                game.roll(1);
                result = game.wasCorrectlyAnswered();
            }

            expect(logs).to.include('Alice now has 6 Gold Coins.');
            expect(result).to.equal(false);
        });

        it('tracks each player\'s purse independently (regression: used to share one index)', function() {
            const game = new Game();
            game.add('Alice');
            game.add('Bob');

            game.roll(1);
            game.wasCorrectlyAnswered(); // Alice: purse -> 1, turn -> Bob
            game.roll(1);
            game.wasCorrectlyAnswered(); // Bob: purse -> 1, turn -> Alice
            game.roll(1);
            game.wasCorrectlyAnswered(); // Alice: purse -> 2, turn -> Bob

            expect(logs).to.include('Alice now has 2 Gold Coins.');
            expect(logs).to.include('Bob now has 1 Gold Coins.');
        });
    });
});
