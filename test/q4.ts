import { Exp, Program, isBoolExp, isExp, isProgram, isCExp, isDefineExp, CExp, isAtomicExp, isIfExp, isAppExp, isProcExp, isNumExp, isVarRef, isPrimOp } from '../imp/L2-ast';
import { Result, makeOk, mapResult, bind, safe3, safe2, makeFailure } from '../imp/result';
import { map } from 'ramda';
import { isForExp } from './L21-ast';

/*
Purpose: Transforms a given L2 program to a JavaScript program
Signature: l2ToJS(exp)
Type: [Exp | Program -> Result<string>]
*/
export const l2ToJS = (exp: Exp | Program): Result<string> => 
    isProgram(exp) ? exp.exps.length === 1 ? bind(mapResult(l2ToJS, exp.exps), (exps: string[]) => makeOk(exps.join(";\n"))) :
                    bind(mapResult(l2ToJS, exp.exps), 
                    (exps: string[]) : Result<string> => {
                        exps[exps.length-1] = "console.log(" + exps[exps.length-1];
                        return makeOk(exps.join(";\n")+");") 
                    }): 
    isBoolExp(exp) ? makeOk(exp.val ? "true" : "false") :
    isNumExp(exp) ? makeOk(exp.val.toString()) :
    isVarRef(exp) ? makeOk(exp.var) :
    isPrimOp(exp) && exp.op !== "=" && exp.op !== "not" ? makeOk(exp.op) :
    isPrimOp(exp) && exp.op === "=" ? makeOk("===") : 
    isPrimOp(exp) && exp.op === "not" ? makeOk("!") :
    isDefineExp(exp) ? bind(l2ToJS(exp.val), (val: string) => makeOk('const' + ' ' + exp.var.var + ' ' + '=' + ' ' + val)) :
    isProcExp(exp) ? exp.body.length === 1 ? bind(mapResult(l2ToJS, exp.body), (body: string[]) => makeOk(`((${map(v => v.var, exp.args).join(",")}${")"} ${"=>"} ${body.join(" ")})`)) :
                    bind(mapResult(l2ToJS, exp.body), 
                    (body: string[]) : Result<string> => {
                        let str = body.join(";^");
                        let newbody = str.split("^", 3);
                        newbody.splice(body.length-1, 0 ,"return");
                        return makeOk(`((${map(v => v.var, exp.args).join(",")}${")"} ${"=>"} ${"{"}${newbody.join(" ")}${";"}${"}"})`);
                    }) :
    isIfExp(exp) ? safe3((test: string, then: string, alt: string) => makeOk(`(${test} ${"?"} ${then} ${":"} ${alt})`))
                    (l2ToJS(exp.test), l2ToJS(exp.then), l2ToJS(exp.alt)) :
    isAppExp(exp) ? isPrimOp(exp.rator) && exp.rator.op === "and" ? safe2((rator: string, rands: string[]) => makeOk(`(${rands.join(" "+ "&&" + " ")})`))
                        (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
                        isPrimOp(exp.rator) && exp.rator.op === "or" ? safe2((rator: string, rands: string[]) => makeOk(`(${rands.join(" "+ "||" + " ")})`))
                        (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
                        isPrimOp(exp.rator) && exp.rator.op === "eq?" ? safe2((rator: string, rands: string[]) => makeOk(`(${rands.join(" "+ "===" + " ")})`))
                        (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
                        isPrimOp(exp.rator) && exp.rator.op === "boolean?" ? safe2((rator: string, rands: string[]) => makeOk(`(typeof ${rands.join()} === 'boolean')`))
                        (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
                        isPrimOp(exp.rator) && exp.rator.op === "number?" ? safe2((rator: string, rands: string[]) => makeOk(`(typeof ${rands.join("")} === 'number')`))
                        (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
                        isPrimOp(exp.rator) && exp.rator.op !== "not" ? safe2((rator: string, rands: string[]) => makeOk(`(${rands.join(" "+ rator + " ")})`))
                        (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
                        isPrimOp(exp.rator) && exp.rator.op === "not" ? safe2((rator: string, rands: string[]) => makeOk(`${"("}${rator}${rands.join(",")})`))
                            (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
                        safe2((rator: string, rands: string[]) => makeOk(`${rator}${"("}${rands.join(",")})`))
                        (l2ToJS(exp.rator), mapResult(l2ToJS, exp.rands)) :
    makeFailure(`Unknown expression: ${exp}`);
