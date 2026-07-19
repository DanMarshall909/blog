---
title: "Don’t Just Plug Holes in Mutation Tests"
author: Dan Marshall
date: "2026-07-19"
tags: ["mutation-testing", "testing", "software-design", "solid"]
description: "A surviving mutant is not automatically a request for another test. It may be exposing unnecessary code, a missing specification, or a design responsibility in the wrong place."
template: article.pug
---

When mutation testing exposes a surviving mutant, the obvious response is to add another test.

That may be the right answer, but it should not be the automatic one.

A surviving mutant is evidence that something is unclear. The test suite may be incomplete, but the underlying problem could be elsewhere:

- Is this code actually required?
- Is the behaviour important enough to specify?
- Does the code have too many responsibilities?
- Is the mutation exposing a missing business rule?
- Is the implementation more complex than the requirement?
- Would deleting or simplifying the code be safer than testing it?

Mutation testing should not become a coverage game where every survivor is mechanically eliminated with another assertion. That produces brittle tests which describe implementation details rather than meaningful behaviour.

Tools such as [Stryker.NET](https://stryker-mutator.io/docs/stryker-net/introduction/) and [StrykerJS for TypeScript and JavaScript](https://stryker-mutator.io/docs/stryker-js/introduction/) are most useful when they make us question the code, not merely when they produce a higher mutation score.

---

## A Small Example

Suppose mutation testing changes `>` to `>=` and the mutant survives:

```csharp
public bool QualifiesForDiscount(Customer customer)
{
    return customer.CompletedOrders > 10;
}
```

The quickest response is to add a test for exactly ten completed orders:

```csharp
[Fact(DisplayName = "does not qualify a customer with exactly ten completed orders")]
public void does_not_qualify_a_customer_with_exactly_ten_completed_orders()
{
    var customer = new Customer(completedOrders: 10);

    var result = new DiscountEligibility().QualifiesForDiscount(customer);

    result.Should().BeFalse(
        because: "the discount currently requires more than ten completed orders");
}
```

That kills the mutant, but it may also encode an assumption nobody deliberately made.

Before adding the test, ask where the rule came from. Does the business mean *more than ten orders* or *ten or more*? Is order count even the intended measure? Does another service already decide customer status?

Until those questions are answered, the survivor may be exposing a missing specification rather than a missing assertion.

The correct outcome could be the test above. It could also be changing the boundary, replacing the logic with a named policy, or deleting the method because it duplicates an existing decision.

---

## Check the Responsibility Boundary

A difficult-to-kill mutant can also reveal a design problem.

Imagine that `DiscountService` calculates eligibility, reads configuration, queries order history, writes audit records and sends an email. Testing one boundary condition may require constructing half the application.

That is not necessarily a testing problem. It may be evidence that the class has too many reasons to change.

The [Single Responsibility Principle](https://blog.cleancoder.com/uncle-bob/2014/05/08/SingleReponsibilityPrinciple.html) is often reduced to “a class should do one thing”, but the more useful framing is that a module should be responsible to one actor or source of change.

The mutation may be pointing at logic that belongs in a smaller policy object:

```csharp
public sealed class RepeatCustomerDiscountPolicy
{
    private const int RequiredCompletedOrders = 10;

    public bool IsEligible(Customer customer) =>
        customer.CompletedOrders >= RequiredCompletedOrders;
}
```

Now the rule is named, isolated and easy to specify. The test no longer needs to know about configuration, persistence, auditing or email delivery.

The surviving mutant did not merely reveal a hole in test coverage. It revealed that a business decision was buried inside an unrelated workflow.

---

## Consider Deleting the Code

Some mutants survive because the mutated code has no observable effect.

That may mean the test suite is weak. It may also mean the code is redundant, unreachable or defensive against a state the system cannot enter.

Adding a test for meaningless behaviour makes the code harder to remove later. Before doing that, try deleting the line or branch and running the full suite.

Then ask:

- What user-visible or system-visible behaviour changes?
- Which requirement demands this branch?
- Can the invalid state occur through a supported path?
- Is another layer already enforcing the same constraint?

If nobody can identify a meaningful consequence, deletion may be the strongest mutation-testing result available.

---

## The Mutation Score Is Not the Product

A mutation score is a diagnostic signal, not a business objective.

Chasing 100% by adding increasingly narrow assertions can leave you with a test suite that is tightly coupled to the current implementation while saying very little about what the system is meant to do.

Treat each surviving mutant as an invitation to investigate:

1. Identify the observable behaviour the mutation would change.
2. Confirm that the behaviour is specified and valuable.
3. Check whether the logic belongs to the current responsibility.
4. Simplify or delete unnecessary code.
5. Add the smallest test that expresses the confirmed rule.

The goal is not to kill mutants.

The goal is to use mutants to expose ambiguity, unnecessary code, weak specifications and poor design boundaries. Killing the mutant should be a consequence of improving the system—not the objective by itself.
