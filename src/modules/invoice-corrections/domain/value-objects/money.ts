export class Money {
    private constructor(readonly cents: number) {}

    static fromDecimal(value: number): Money {
        return new Money(Math.round(value * 100));
    }

    static zero(): Money {
        return new Money(0);
    }

    toDecimal(): number {
        return this.cents / 100;
    }

    add(other: Money): Money {
        return new Money(this.cents + other.cents);
    }

    subtract(other: Money): Money {
        return new Money(this.cents - other.cents);
    }

    negate(): Money {
        return new Money(-this.cents);
    }

    abs(): Money {
        return new Money(Math.abs(this.cents));
    }

    isGreaterThan(other: Money): boolean {
        return this.cents > other.cents;
    }

    isLessThan(other: Money): boolean {
        return this.cents < other.cents;
    }

    isZero(): boolean {
        return this.cents === 0;
    }
}
