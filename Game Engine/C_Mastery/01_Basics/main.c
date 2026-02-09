#include <stdio.h>

int main()
{

int age;
float height;
char initial;

printf("Hello, C Mastery!\n");

    printf("What is your age? ");
    scanf("%d", &age);

    printf("What is your height? ");
    scanf("%f", &height);

    printf("What is your initial? ");
    scanf(" %c", &initial); // Note the space before %c to consume any leftover newline

    printf("\n--- Results ---\n");
    printf("Age: %d\n", age);
    printf("Height: %.2f\n", height);
    printf("Initial: %c\n", initial);

    return 0;
}