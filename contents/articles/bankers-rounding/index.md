---
title: "Avoid death by accountant - Get bankers rounding right!"
author: Dan Marshall
date: "2025-02-23"
tags: ["finance", "rounding", "bankers rounding", "accounting", "C#"]
template: article.pug
---

![Death by Accountant](death-by-accountant.jpg)

If you work with financial data, you will run into the situation where you need to round calculated values to the nearest cent.

If you round up in every case, then that may work internally, but if your accounting package works otherwise (**it will**), and the other side of the ledger comes from somewhere other than your code, you may well have values that don't balance exactly—which is critical for accounting purposes. 

So it's important to have these rounding algorithms in sync, or you'll run into an **angry accountant**. Given the number of transactions that occur daily in most systems, this will pop up often if it doesn't get done right.

## **Different Rounding Methods**
There are many possible ways to calculate rounding when you have a difference of exactly **$0.005**. [See wikipedia](https://en.wikipedia.org/wiki/Rounding#Rounding_half_to_even). 

Do you round up to **1c**, or down to **0c**? Note that this isn't an issue for **$0.0051**, which is closer to **1c**. It's only for **exact amounts ending in 5** as the third significant digit.

## **Bankers Rounding - The Standard in Finance**
Thankfully, a convention has arisen in the financial world called **Bankers Rounding**. This is the **default rounding mode in C#** for `decimal`, but it **can be overridden** by choosing a different midpoint rounding mode. 

I've seen this done a lot, **often for no good reason.** 😬

### **How Bankers Rounding Works**
Bankers Rounding rounds every amount **up or down to the nearest EVEN cent**.

### **Example 1 - Rounding Up**
Consider **$0.555**, which has two EVEN cents on either side:

$0.54 (difference of 1.5c) → rounding down. $0.555 $0.56 (difference of 0.5c) → rounding up.

Since **0.5 < 1.5**, we round up.

**$0.555 → $0.56**

### **Example 2 - Rounding Down**
Consider **$0.565**, which also has two EVEN cents on either side:

$0.56 (difference of 0.5c) → rounding down. $0.565 $0.58 (difference of 1.5c) → rounding up.

Since **0.5 < 1.5**, we round up.

**$0.565 → $0.56**

---

## **Best Practice: Use a Financial Math Library**
To prevent issues, **create an organization-wide Financial Math library** that includes a rounding method like this:

```csharp
public static decimal UsingBankersRoundingToNearestCent(this decimal amount) 
    => Math.Round(amount, 2, MidpointRounding.ToEven);
```

And enforce its usage across your codebase.

Even better:
- Add a linting rule to detect any usage of Math.Round() and flag it as an error.
- Require explicit overrides when necessary, ensuring no unexpected rounding bugs creep in.