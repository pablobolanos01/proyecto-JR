using System;
using System.Collections;
using System.Collections.Generic;
using Unity.VisualScripting;
using UnityEngine;
using UnityEngine.SceneManagement;
using UnityEngine.SocialPlatforms.Impl;

public class PlayerMain : MonoBehaviour
{
    public float spd = 15f;
    public float jump = 3f;
    //public Canvas ui;
    private Rigidbody2D rb;
    private bool grounded;
    private bool hit = false;
    private float inputX, inputY;
    SpriteRenderer sr;
    Animator anim;
    // Start is called before the first frame update
    void Start()
    {
        GameManager.playerHealth = 3;
        rb = GetComponent<Rigidbody2D>();
        sr = GetComponent<SpriteRenderer>();
        anim = GetComponent<Animator>();
    }

    // Update is called once per frame
    void Update()
    {
        inputX = Input.GetAxis("Horizontal");
        inputY = Input.GetAxis("Vertical");

        if (Input.GetButtonDown("Jump") && grounded)
        {
            float jmpF = Mathf.Sqrt(-(2 * Physics2D.gravity.y * jump));
            rb.AddForce(new Vector2(0, jmpF), ForceMode2D.Impulse);
        }
    }
    private void FixedUpdate()
    {
        //inputX = Input.GetAxis("Horizontal");
        if (!hit)
        {
            rb.velocity = new Vector2(inputX * spd, rb.velocity.y);
            sr.flipX = rb.velocity.x < 0 || (rb.velocity.x == 0 && sr.flipX);
        }
        anim.SetFloat("spd", Mathf.Abs(rb.velocity.x));
        anim.SetBool("grounded", grounded);
    }
    private void OnCollisionEnter2D(Collision2D collision)
    {
        if (collision.gameObject.tag == "suelo")
        {
            hit = false;
        }
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
        if (collision.gameObject.tag == "enemigo" && !hit)
        {
            anim.SetTrigger("damage");
            takeDamage();
        }
    }
    private void OnTriggerEnter2D(Collider2D collision)
    {
        if (collision.gameObject.name.StartsWith("coin"))
        {
            collision.gameObject.SetActive(false);
            GameManager.score += 100;
            GameManager.coins++;
        }
        if (collision.gameObject.name.StartsWith("health"))
        {
            collision.gameObject.SetActive(false);
            GameManager.playerHealth += GameManager.playerHealth >= 3 ? 0 : 1;
            GameManager.score += 200;
        }
        if (collision.gameObject.tag == "proj_e" && !hit)
        {
            anim.SetTrigger("damage");
            takeDamage();
            Destroy(collision.gameObject);
        }
        if(collision.gameObject.name == "oob_kill")
        {
            GameManager.playerHealth = 0;
            takeDamage();
        }
    }

    private void takeDamage()
    {
        hit = true;
        GameManager.playerHealth--;
        rb.velocity = Vector2.zero;
        rb.AddForce(new Vector2(sr.flipX ? 5f : -5f, 5f), ForceMode2D.Impulse);
        if (GameManager.playerHealth <= 0)
        {
            anim.SetTrigger("die");
            transform.Find("gunPoint").gameObject.SetActive(false); //desactivar arma
        }
    }
    private void gameOver(int check) //https://docs.unity3d.com/Manual/script-AnimationWindowEvent.html
    {
        if (check == 1)
        {
            Time.timeScale = 0;
            SceneManager.LoadScene("titulo");
            GameManager.score = 0;
            GameManager.enemyCount = 0;
            GameManager.maxEnemyCount = 0;
            GameManager.coins = 0;
        }
    }
}
