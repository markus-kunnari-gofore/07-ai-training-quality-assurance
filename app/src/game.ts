interface Player {
    name: string;
    place: number;
    purse: number;
    inPenaltyBox: boolean;
}

export class Game {

    private players: Array<Player> = [];
    private currentPlayer: number = 0;
    private justGotOutOfPenaltyBox: boolean = false;

    private static readonly CATEGORIES = ['Pop', 'Science', 'Sports', 'Rock'];

    private popQuestions: Array<string> = [];
    private scienceQuestions: Array<string> = [];
    private sportsQuestions: Array<string> = [];
    private rockQuestions: Array<string> = [];

    constructor() {

        for (let i = 0; i < 50; i++) {
            this.popQuestions.push("Pop Question " + i);
            this.scienceQuestions.push("Science Question " + i);
            this.sportsQuestions.push("Sports Question " + i);
            this.rockQuestions.push(this.createRockQuestion(i));
          }
    }

    private createRockQuestion(index: number): string {
        return "Rock Question " + index;
    }

    public add(name: string): boolean {
        this.players.push({name: name, place: 0, purse: 0, inPenaltyBox: false});

        console.log(name + " was added");
        console.log("They are player number " + this.players.length);

        return true;
    }

    private currentPlayerData(): Player {
        return this.players[this.currentPlayer];
    }

    private nextPlayer(): void {
        this.currentPlayer += 1;
        if (this.currentPlayer == this.players.length) {
            this.currentPlayer = 0;
        }
    }

    public roll(roll: number) {
        const player = this.currentPlayerData();
        console.log(player.name + " is the current player");
        console.log("They have rolled a " + roll);

        if (player.inPenaltyBox) {
          if (roll % 2 != 0) {
            this.justGotOutOfPenaltyBox = true;

            console.log(player.name + " is getting out of the penalty box");
            this.movePlayer(player, roll);
          } else {
            console.log(player.name + " is not getting out of the penalty box");
            this.justGotOutOfPenaltyBox = false;
          }
        } else {

          this.movePlayer(player, roll);
        }
    }

    private movePlayer(player: Player, roll: number): void {
        player.place = (player.place + roll) % 12;

        console.log(player.name + "'s new location is " + player.place);
        console.log("The category is " + this.currentCategory(player));
        this.askQuestion(player);
    }

    private askQuestion(player: Player): void {
        console.log(this.questionsFor(this.currentCategory(player)).shift());
    }

    private questionsFor(category: string): Array<string> {
        switch (category) {
            case 'Pop':
                return this.popQuestions;
            case 'Science':
                return this.scienceQuestions;
            case 'Sports':
                return this.sportsQuestions;
            default:
                return this.rockQuestions;
        }
    }

    private currentCategory(player: Player): string {
        return Game.CATEGORIES[player.place % 4];
    }

    private hasPlayerWon(player: Player): boolean {
        return player.purse == 6;
    }

    public wrongAnswer(): boolean {
        const player = this.currentPlayerData();
        console.log('Question was incorrectly answered');
        console.log(player.name + " was sent to the penalty box");
        player.inPenaltyBox = true;

        this.nextPlayer();
        return true;
    }

    public wasCorrectlyAnswered(): boolean {
        const player = this.currentPlayerData();

        if (player.inPenaltyBox && !this.justGotOutOfPenaltyBox) {
            this.nextPlayer();
            return true;
        }

        console.log('Answer was correct!!!!');
        player.purse += 1;
        console.log(player.name + " now has " + player.purse + " Gold Coins.");

        const stillPlaying = !this.hasPlayerWon(player);
        this.nextPlayer();
        return stillPlaying;
    }

}
