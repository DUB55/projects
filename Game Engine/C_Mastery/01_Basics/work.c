#include <stdio.h>

int main() {
    int age;
    float height;
    char initial;

    printf("--- C Mastery: Basics ---\n");

    // Capture Age
    printf("Enter your age: ");
    scanf("%d", &age);

    // Capture Height
    printf("Enter your height (e.g., 1.85): ");
    scanf("%f", &height);

    // Capture Initial
    // Note: The space before %c handles the newline character from the previous input
    printf("Enter your first initial: ");
    scanf(" %c", &initial);

    // Output the summary
    printf("\nProfile Summary:\n");
    printf("You are %d years old, %.2fm tall, and your initial is '%c'.\n", age, height, initial);

    return 0;
}