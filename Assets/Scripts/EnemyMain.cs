using System;
using System.Collections;
using System.Collections.Generic;
using Unity.Burst.CompilerServices;
using UnityEngine;
using UnityEngine.Windows;

public class EnemyMain : MonoBehaviour
{
    public float spd = 2f;
    private bool grounded;
    private bool die = false;
    private Rigidbody2D rb;
    SpriteRenderer sr;
    Animator anim;
    // Start is called before the first frame update
    void Start()
    {
        rb = GetComponent<Rigidbody2D>();
        sr = GetComponent<SpriteRenderer>();
        anim = GetComponent<Animator>();
    }

    // Update is called once per frame
    void Update()
    {

    }
    private void FixedUpdate()
    {
        if (Mathf.Abs(GameObject.FindGameObjectWithTag("Player").transform.position.x - transform.position.x) <= 15f && Mathf.Abs(GameObject.FindGameObjectWithTag("Player").transform.position.x - transform.position.x) > 5f)
        {
            if (GameObject.FindGameObjectWithTag("Player").transform.position.x - transform.position.x > 0)
            {
                rb.velocity = new Vector2(spd, rb.velocity.y);
            }
            else
            {
                rb.velocity = new Vector2(-spd, rb.velocity.y);
            }
        }
        if (die)
        {
            rb.velocity = Vector2.zero;
            transform.Find("gunPoint").gameObject.SetActive(false);
        }
        anim.SetFloat("spd", MathF.Abs(rb.velocity.x));
        anim.SetBool("grounded", grounded);
        sr.flipX = GameObject.FindGameObjectWithTag("Player").transform.position.x < transform.position.x;
    }

    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.gameObject.tag == "proj_p")
        {
            Destroy(collision.gameObject);
            anim.SetTrigger("die");
            die = true;
        }
    }
    private void OnCollisionEnter2D(Collision2D collision)
    {

    }

    private void OnCollisionStay2D(Collision2D collision)
    {
        if (collision.gameObject.tag == "suelo")
        {
            //Debug.Log("tocando suelo");
            grounded = true;
        }
    }
    private void OnCollisionExit2D(Collision2D collision)
    {
        if (collision.gameObject.tag == "suelo")
        {
            //Debug.Log("saliendo de suelo");
            grounded = false;
        }
    }

    private void dieEvent(int check) //https://docs.unity3d.com/Manual/script-AnimationWindowEvent.html
    {
        if (check == 1)
        {
            GameManager.score += 500;
            GameManager.enemyCount--;
            Destroy(gameObject);
        }
    }
}
