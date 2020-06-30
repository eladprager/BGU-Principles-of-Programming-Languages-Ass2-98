import { makeIfExp, makeDefineExp, CExp, Exp ,ForExp, AppExp, Program, makeNumExp, makeProgram,  makeProcExp, makeAppExp, isExp, isProgram, isCExp, isDefineExp, isAtomicExp, isIfExp, isAppExp, isProcExp, isForExp } from "./L21-ast";
import { Result, makeOk } from "../imp/result";
import { map, range } from "ramda";

/*
Purpose: Applies a syntactic transoformation from a ForExp to an equivalent AppExp
Signature: for2app(exp)
Type: [ForExp -> AppExp]
*/
export const for2app = (exp: ForExp): AppExp =>
    makeAppExp(makeProcExp([], map((num : number) => 
    makeAppExp(makeProcExp([exp.var], isForExp(exp.body) ? [for2app(exp.body)] : [exp.body]), [makeNumExp(num)]),
        range(exp.start.val, exp.end.val+1))),[]);

/*
Purpose: Gets an L21 AST and returns an equivalent L2 AST
Signature: L21ToL2(exp)
Type: [Exp | Program -> Result<Exp | Program>]
*/
export const L21ToL2 = (exp: Exp | Program): Result<Exp | Program> =>
    isExp(exp) ? makeOk(rewriteAllLetExp(exp)) :
    isProgram(exp) ? makeOk(makeProgram(map(rewriteAllLetExp, exp.exps))) :
    makeOk(exp)



const rewriteAllLetExp = (exp: Exp): Exp =>
    isCExp(exp) ? rewriteAllLetCExp(exp) :
    isDefineExp(exp) ? makeDefineExp(exp.var, rewriteAllLetCExp(exp.val)) :
    exp;

const rewriteAllLetCExp = (exp: CExp): CExp =>
    isAtomicExp(exp) ? exp :
    isIfExp(exp) ? makeIfExp(rewriteAllLetCExp(exp.test),
                             rewriteAllLetCExp(exp.then),
                             rewriteAllLetCExp(exp.alt)) :
    isAppExp(exp) ? makeAppExp(rewriteAllLetCExp(exp.rator),
                               map(rewriteAllLetCExp, exp.rands)) :
    isProcExp(exp) ? makeProcExp(exp.args, map(rewriteAllLetCExp, exp.body)) :
    isForExp(exp) ? for2app(exp) :
    exp
